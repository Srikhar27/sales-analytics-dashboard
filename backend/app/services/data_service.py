"""Database query, export, and record retrieval services."""

import io
import math
from typing import Dict, Any, List, Optional
import pandas as pd
from sqlalchemy import select, func, or_, desc, asc, delete
from sqlalchemy.orm import Session
from app.models.sales import SalesRecord
from app.schemas.sales import DateRangeFilter


def get_records(
    db: Session,
    filters: Optional[DateRangeFilter] = None,
    page: int = 1,
    page_size: int = 50,
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: str = "asc"
) -> Dict[str, Any]:
    """Retrieve paginated sales records with filtering, searching, and sorting.

    Args:
        db: SQLAlchemy database session.
        filters: Optional date, region, and category filters.
        page: Page number (1-indexed).
        page_size: Number of records per page.
        search: Optional search term matching order ID, customer name, or product name.
        sort_by: Column name to sort on.
        sort_order: Sort direction ('asc' or 'desc').

    Returns:
        Dict[str, Any]: Dictionary containing records list, total count, page, and total pages.
    """
    page = max(1, page)
    page_size = max(1, min(page_size, 500))

    query = select(SalesRecord)

    # Apply date and categorical filters
    if filters:
        if filters.start_date:
            query = query.where(SalesRecord.order_date >= filters.start_date)
        if filters.end_date:
            query = query.where(SalesRecord.order_date <= filters.end_date)
        if filters.region:
            query = query.where(SalesRecord.region == filters.region)
        if filters.category:
            query = query.where(SalesRecord.category == filters.category)

    # Apply search filter
    if search and search.strip():
        search_pattern = f"%{search.strip()}%"
        query = query.where(
            or_(
                SalesRecord.order_id.ilike(search_pattern),
                SalesRecord.customer_name.ilike(search_pattern),
                SalesRecord.product_name.ilike(search_pattern),
                SalesRecord.city.ilike(search_pattern),
                SalesRecord.state.ilike(search_pattern)
            )
        )

    # Count total matching rows
    count_query = select(func.count()).select_from(query.subquery())
    total_count = db.execute(count_query).scalar() or 0

    # Sorting
    sort_column = getattr(SalesRecord, sort_by, None) if sort_by else None
    if sort_column is not None:
        direction = desc if sort_order.lower() == "desc" else asc
        query = query.order_by(direction(sort_column))
    else:
        query = query.order_by(SalesRecord.order_date.desc(), SalesRecord.id.desc())

    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    records = db.execute(query).scalars().all()
    total_pages = math.ceil(total_count / page_size) if total_count > 0 else 1

    return {
        "data": records,
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


def get_preview(
    db: Session,
    batch_id: Optional[str] = None,
    limit: int = 100
) -> List[Dict[str, Any]]:
    """Retrieve sample rows for quick previewing.

    Args:
        db: SQLAlchemy database session.
        batch_id: Optional upload batch identifier.
        limit: Max rows to return.

    Returns:
        List[Dict[str, Any]]: List of dictionary representations of records.
    """
    query = select(SalesRecord).order_by(SalesRecord.id.asc()).limit(limit)
    if batch_id:
        query = query.where(SalesRecord.upload_batch_id == batch_id)

    records = db.execute(query).scalars().all()
    return [
        {
            "id": r.id,
            "order_id": r.order_id,
            "order_date": r.order_date.isoformat() if r.order_date else None,
            "ship_date": r.ship_date.isoformat() if r.ship_date else None,
            "ship_mode": r.ship_mode,
            "customer_id": r.customer_id,
            "customer_name": r.customer_name,
            "segment": r.segment,
            "country": r.country,
            "city": r.city,
            "state": r.state,
            "postal_code": r.postal_code,
            "region": r.region,
            "product_id": r.product_id,
            "category": r.category,
            "sub_category": r.sub_category,
            "product_name": r.product_name,
            "sales": r.sales,
            "quantity": r.quantity,
            "discount": r.discount,
            "profit": r.profit,
            "upload_batch_id": r.upload_batch_id,
            "created_at": r.created_at.isoformat() if r.created_at else None
        }
        for r in records
    ]


def export_to_csv(
    db: Session,
    filters: Optional[DateRangeFilter] = None
) -> str:
    """Generate CSV string containing sales records matching filter criteria.

    Args:
        db: SQLAlchemy database session.
        filters: Optional date, region, and category filters.

    Returns:
        str: Comma-separated values formatted data.
    """
    query = select(SalesRecord)

    if filters:
        if filters.start_date:
            query = query.where(SalesRecord.order_date >= filters.start_date)
        if filters.end_date:
            query = query.where(SalesRecord.order_date <= filters.end_date)
        if filters.region:
            query = query.where(SalesRecord.region == filters.region)
        if filters.category:
            query = query.where(SalesRecord.category == filters.category)

    records = db.execute(query.order_by(SalesRecord.order_date.asc())).scalars().all()

    if not records:
        return "order_id,order_date,ship_date,ship_mode,customer_id,customer_name,segment,country,city,state,postal_code,region,product_id,category,sub_category,product_name,sales,quantity,discount,profit\n"

    rows = []
    for r in records:
        rows.append({
            "order_id": r.order_id,
            "order_date": r.order_date.isoformat() if r.order_date else "",
            "ship_date": r.ship_date.isoformat() if r.ship_date else "",
            "ship_mode": r.ship_mode or "",
            "customer_id": r.customer_id or "",
            "customer_name": r.customer_name or "",
            "segment": r.segment or "",
            "country": r.country or "",
            "city": r.city or "",
            "state": r.state or "",
            "postal_code": r.postal_code or "",
            "region": r.region or "",
            "product_id": r.product_id or "",
            "category": r.category or "",
            "sub_category": r.sub_category or "",
            "product_name": r.product_name or "",
            "sales": r.sales,
            "quantity": r.quantity if r.quantity is not None else "",
            "discount": r.discount if r.discount is not None else "",
            "profit": r.profit if r.profit is not None else ""
        })

    df = pd.DataFrame(rows)
    buf = io.StringIO()
    df.to_csv(buf, index=False)
    return buf.getvalue()


def get_distinct_values(db: Session, column: str) -> List[str]:
    """Retrieve unique non-null values for a given column to populate filter dropdowns.

    Args:
        db: SQLAlchemy database session.
        column: Column name on SalesRecord.

    Returns:
        List[str]: Alphabetically sorted unique values.
    """
    col_attr = getattr(SalesRecord, column, None)
    if col_attr is None:
        return []

    stmt = (
        select(col_attr)
        .where(col_attr.isnot(None), col_attr != "")
        .distinct()
        .order_by(col_attr.asc())
    )
    results = db.execute(stmt).scalars().all()
    return [str(val) for val in results if val is not None]


def clear_all_data(db: Session) -> Dict[str, Any]:
    """Delete all records from the sales database.

    Args:
        db: SQLAlchemy database session.

    Returns:
        Dict[str, Any]: Status summary and number of deleted rows.
    """
    count = db.execute(select(func.count(SalesRecord.id))).scalar() or 0
    db.execute(delete(SalesRecord))
    db.commit()
    return {
        "deleted_records": int(count),
        "message": f"Successfully cleared {count} sales records."
    }
