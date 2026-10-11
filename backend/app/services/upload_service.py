"""Data ingestion and CSV processing service."""

import io
import re
import uuid
from typing import Dict, List, Optional
import pandas as pd
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.models.sales import SalesRecord
from app.schemas.analytics import DataQualityReport
from app.schemas.upload import UploadResponse

# Standard target fields
REQUIRED_FIELDS = {"order_id", "order_date", "sales"}

ALL_MODEL_FIELDS = [
    "order_id", "order_date", "ship_date", "ship_mode",
    "customer_id", "customer_name", "segment", "country",
    "city", "state", "postal_code", "region", "product_id",
    "category", "sub_category", "product_name", "sales",
    "quantity", "discount", "profit"
]

FIELD_ALIASES = {
    "order_id": ["order id", "order_id", "orderid", "order number", "orderno"],
    "order_date": ["order date", "order_date", "orderdate", "date"],
    "ship_date": ["ship date", "ship_date", "shipdate"],
    "ship_mode": ["ship mode", "ship_mode", "shipmode", "shipping mode"],
    "customer_id": ["customer id", "customer_id", "customerid"],
    "customer_name": ["customer name", "customer_name", "customername", "customer"],
    "segment": ["segment", "customer segment"],
    "country": ["country", "nation"],
    "city": ["city", "town"],
    "state": ["state", "province"],
    "postal_code": ["postal code", "postal_code", "postalcode", "zip", "zip code", "zipcode"],
    "region": ["region", "area"],
    "product_id": ["product id", "product_id", "productid", "item id"],
    "category": ["category", "product category", "item type", "item_type"],
    "sub_category": ["sub-category", "sub category", "sub_category", "subcategory"],
    "product_name": ["product name", "product_name", "productname", "item name", "product", "item type"],
    "sales": ["sales", "sale", "revenue", "amount", "total sales", "order amount", "total revenue", "total_revenue"],
    "quantity": ["quantity", "qty", "units", "quantity sold", "units sold", "units_sold"],
    "discount": ["discount", "disc", "discount rate"],
    "profit": ["profit", "net profit", "margin amount", "earnings", "total profit", "total_profit"]
}


def _normalize_name(name: str) -> str:
    """Normalize a header string for comparison."""
    return re.sub(r"[^a-z0-9]", "", str(name).lower())


def detect_column_mapping(df_columns: List[str]) -> Dict[str, str]:
    """Auto-detect target model fields from input column headers.

    Args:
        df_columns: List of raw CSV column names.

    Returns:
        Dict[str, str]: Mapping from raw column name to internal field name.
    """
    mapping: Dict[str, str] = {}
    normalized_aliases = {
        field: [_normalize_name(alias) for alias in aliases]
        for field, aliases in FIELD_ALIASES.items()
    }

    for col in df_columns:
        col_norm = _normalize_name(col)
        matched_field = None
        for target_field, aliases in normalized_aliases.items():
            if col_norm in aliases:
                matched_field = target_field
                break
        if matched_field:
            mapping[col] = matched_field

    return mapping


def process_csv_upload(
    file_bytes: bytes,
    filename: str,
    column_mapping: Optional[Dict[str, str]],
    db: Session
) -> UploadResponse:
    """Parse, clean, validate, and store sales data from an uploaded CSV file.

    Args:
        file_bytes: Raw byte contents of the uploaded CSV.
        filename: Original file name.
        column_mapping: Optional user-provided or auto-detected column mapping.
        db: SQLAlchemy database session.

    Returns:
        UploadResponse: Ingestion metrics and quality assessment.
    """
    batch_id = str(uuid.uuid4())
    warnings: List[str] = []
    errors: List[str] = []

    if not file_bytes:
        return UploadResponse(
            batch_id=batch_id,
            records_processed=0,
            records_inserted=0,
            warnings=["Uploaded file is empty."],
            errors=["No data to process."],
            quality_report=DataQualityReport()
        )

    # 1. Parse CSV with pandas
    try:
        try:
            df = pd.read_csv(io.BytesIO(file_bytes), encoding="utf-8")
        except UnicodeDecodeError:
            df = pd.read_csv(io.BytesIO(file_bytes), encoding="latin1")
    except Exception as exc:
        return UploadResponse(
            batch_id=batch_id,
            records_processed=0,
            records_inserted=0,
            warnings=[],
            errors=[f"Failed to parse CSV file: {str(exc)}"],
            quality_report=DataQualityReport()
        )

    if df.empty:
        return UploadResponse(
            batch_id=batch_id,
            records_processed=0,
            records_inserted=0,
            warnings=["CSV contains headers but no records."],
            errors=[],
            quality_report=DataQualityReport()
        )

    total_records = len(df)

    # 2. Apply column mapping
    detected_mapping = detect_column_mapping(list(df.columns))
    final_mapping = {**detected_mapping}
    if column_mapping:
        final_mapping.update(column_mapping)

    # Invert mapping: model_field -> original column name
    field_to_col: Dict[str, str] = {}
    for col, model_field in final_mapping.items():
        if col in df.columns and model_field in ALL_MODEL_FIELDS:
            field_to_col[model_field] = col

    # 3. Validate required columns
    missing_required = REQUIRED_FIELDS - set(field_to_col.keys())
    if missing_required:
        return UploadResponse(
            batch_id=batch_id,
            records_processed=total_records,
            records_inserted=0,
            warnings=[],
            errors=[f"Missing required columns in mapping: {', '.join(sorted(missing_required))}"],
            quality_report=DataQualityReport(
                total_records=total_records,
                warnings=[f"Upload aborted due to missing required columns: {', '.join(sorted(missing_required))}"]
            )
        )

    # 4. Clean data and detect quality issues
    processed_df = pd.DataFrame()

    # Map available fields
    for field in ALL_MODEL_FIELDS:
        if field in field_to_col:
            processed_df[field] = df[field_to_col[field]]
        else:
            processed_df[field] = None

    # Quality metrics tracking
    missing_values: Dict[str, int] = {}
    for col in ALL_MODEL_FIELDS:
        missing_count = int(processed_df[col].isna().sum())
        if missing_count > 0:
            missing_values[col] = missing_count

    # Check duplicate rows in raw data
    duplicate_rows_count = int(df.duplicated().sum())

    # Parse and clean dates
    raw_order_dates = processed_df["order_date"].copy()
    parsed_order_dates = pd.to_datetime(raw_order_dates, errors="coerce")
    invalid_dates_count = int((raw_order_dates.notna() & parsed_order_dates.isna()).sum())
    processed_df["order_date"] = parsed_order_dates.dt.date

    if "ship_date" in field_to_col:
        parsed_ship_dates = pd.to_datetime(processed_df["ship_date"], errors="coerce")
        processed_df["ship_date"] = parsed_ship_dates.dt.date

    def _clean_numeric_series(series: pd.Series) -> pd.Series:
        if series.dtype == object:
            cleaned = series.astype(str).str.replace(r"[\$,\s]", "", regex=True)
            cleaned = cleaned.str.replace(r"^\((.*)\)$", r"-\1", regex=True)
            return pd.to_numeric(cleaned, errors="coerce")
        return pd.to_numeric(series, errors="coerce")

    # Coerce numerics
    raw_sales = processed_df["sales"].copy()
    processed_df["sales"] = _clean_numeric_series(processed_df["sales"])
    invalid_numerics_count = int((raw_sales.notna() & processed_df["sales"].isna()).sum())

    for num_col in ["quantity", "discount", "profit"]:
        if num_col in field_to_col:
            raw_val = processed_df[num_col].copy()
            processed_df[num_col] = _clean_numeric_series(processed_df[num_col])
            invalid_numerics_count += int((raw_val.notna() & processed_df[num_col].isna()).sum())

    # Negative profit count
    negative_profit_count = int((processed_df["profit"] < 0).sum()) if "profit" in field_to_col else 0

    # Filter out rows missing vital fields (order_id, order_date, sales)
    valid_mask = (
        processed_df["order_id"].notna() &
        (processed_df["order_id"].astype(str).str.strip() != "") &
        processed_df["order_date"].notna() &
        processed_df["sales"].notna()
    )

    invalid_records_count = total_records - int(valid_mask.sum())
    if invalid_records_count > 0:
        warnings.append(f"{invalid_records_count} records were skipped due to missing order ID, date, or sales.")

    valid_df = processed_df[valid_mask].copy()

    # Fill defaults for optional fields
    valid_df["order_id"] = valid_df["order_id"].astype(str).str.strip()
    valid_df["sales"] = valid_df["sales"].astype(float)
    if "quantity" in valid_df:
        valid_df["quantity"] = valid_df["quantity"].fillna(1).astype(int)
    if "discount" in valid_df:
        valid_df["discount"] = valid_df["discount"].fillna(0.0).astype(float)
    if "profit" in valid_df:
        valid_df["profit"] = valid_df["profit"].fillna(0.0).astype(float)

    # 6. Insert valid records with batch_id
    records_to_insert: List[SalesRecord] = []
    for _, row in valid_df.iterrows():
        rec = SalesRecord(
            order_id=str(row["order_id"]),
            order_date=row["order_date"],
            ship_date=row["ship_date"] if pd.notna(row["ship_date"]) else None,
            ship_mode=str(row["ship_mode"]) if pd.notna(row["ship_mode"]) else None,
            customer_id=str(row["customer_id"]) if pd.notna(row["customer_id"]) else None,
            customer_name=str(row["customer_name"]) if pd.notna(row["customer_name"]) else None,
            segment=str(row["segment"]) if pd.notna(row["segment"]) else None,
            country=str(row["country"]) if pd.notna(row["country"]) else None,
            city=str(row["city"]) if pd.notna(row["city"]) else None,
            state=str(row["state"]) if pd.notna(row["state"]) else None,
            postal_code=str(row["postal_code"]) if pd.notna(row["postal_code"]) else None,
            region=str(row["region"]) if pd.notna(row["region"]) else None,
            product_id=str(row["product_id"]) if pd.notna(row["product_id"]) else None,
            category=str(row["category"]) if pd.notna(row["category"]) else None,
            sub_category=str(row["sub_category"]) if pd.notna(row["sub_category"]) else None,
            product_name=str(row["product_name"]) if pd.notna(row["product_name"]) else None,
            sales=float(row["sales"]),
            quantity=int(row["quantity"]) if pd.notna(row["quantity"]) else None,
            discount=float(row["discount"]) if pd.notna(row["discount"]) else None,
            profit=float(row["profit"]) if pd.notna(row["profit"]) else None,
            upload_batch_id=batch_id
        )
        records_to_insert.append(rec)

    if records_to_insert:
        db.add_all(records_to_insert)
        db.commit()

    records_inserted = len(records_to_insert)

    quality_report = DataQualityReport(
        total_records=total_records,
        missing_values=missing_values,
        duplicate_rows=duplicate_rows_count,
        invalid_dates=invalid_dates_count,
        invalid_numerics=invalid_numerics_count,
        negative_profits=negative_profit_count,
        warnings=warnings
    )

    return UploadResponse(
        batch_id=batch_id,
        records_processed=total_records,
        records_inserted=records_inserted,
        warnings=warnings,
        errors=errors,
        quality_report=quality_report
    )


def get_data_quality_report(db: Session) -> DataQualityReport:
    """Compute data quality assessment on all stored sales records.

    Args:
        db: SQLAlchemy database session.

    Returns:
        DataQualityReport: Comprehensive data quality metrics.
    """
    total_records = db.execute(select(func.count(SalesRecord.id))).scalar() or 0
    if total_records == 0:
        return DataQualityReport(
            total_records=0,
            missing_values={},
            duplicate_rows=0,
            invalid_dates=0,
            invalid_numerics=0,
            negative_profits=0,
            warnings=["Database currently contains no sales records."]
        )

    # Missing values
    missing_values: Dict[str, int] = {}
    check_cols = [
        ("customer_id", SalesRecord.customer_id),
        ("customer_name", SalesRecord.customer_name),
        ("segment", SalesRecord.segment),
        ("region", SalesRecord.region),
        ("category", SalesRecord.category),
        ("sub_category", SalesRecord.sub_category),
        ("product_name", SalesRecord.product_name),
        ("postal_code", SalesRecord.postal_code),
        ("quantity", SalesRecord.quantity),
        ("discount", SalesRecord.discount),
        ("profit", SalesRecord.profit),
    ]

    for name, col in check_cols:
        count = db.execute(select(func.count()).where(col.is_(None))).scalar() or 0
        if count > 0:
            missing_values[name] = int(count)

    # Negative profit count
    negative_profits = db.execute(
        select(func.count(SalesRecord.id)).where(SalesRecord.profit < 0)
    ).scalar() or 0

    # Duplicates check (same order_id and product_id)
    dup_stmt = select(
        SalesRecord.order_id,
        SalesRecord.product_id,
        func.count(SalesRecord.id)
    ).group_by(
        SalesRecord.order_id,
        SalesRecord.product_id
    ).having(func.count(SalesRecord.id) > 1)
    duplicates = len(db.execute(dup_stmt).all())

    warnings: List[str] = []
    if negative_profits > 0:
        warnings.append(f"{negative_profits} line items have negative profit.")
    if duplicates > 0:
        warnings.append(f"{duplicates} potential duplicate line item groups detected.")

    return DataQualityReport(
        total_records=int(total_records),
        missing_values=missing_values,
        duplicate_rows=duplicates,
        invalid_dates=0,
        invalid_numerics=0,
        negative_profits=int(negative_profits),
        warnings=warnings
    )
