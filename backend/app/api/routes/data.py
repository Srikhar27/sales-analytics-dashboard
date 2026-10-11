"""Data ingestion, querying, and maintenance API endpoints."""

import json
from datetime import date
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.core.config import settings
from app.schemas.sales import SalesRecordListResponse, DateRangeFilter
from app.schemas.analytics import DataQualityReport
from app.schemas.upload import UploadResponse
from app.services.upload_service import (
    process_csv_upload,
    get_data_quality_report,
)
from app.services.data_service import (
    get_records,
    get_preview,
    get_distinct_values,
    clear_all_data,
)

router = APIRouter(prefix="/data", tags=["Data"])


@router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_200_OK)
async def upload_csv_file(
    file: UploadFile = File(..., description="Sales CSV file to upload"),
    column_mapping: Optional[str] = Form(
        None,
        description="Optional JSON string mapping source headers to model fields"
    ),
    db: Session = Depends(get_db)
) -> UploadResponse:
    """Upload and process a sales CSV data file with schema mapping and validation."""
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only .csv files are supported."
        )

    file_bytes = await file.read()
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if len(file_bytes) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB."
        )

    parsed_mapping: Optional[Dict[str, str]] = None
    if column_mapping:
        try:
            parsed_mapping = json.loads(column_mapping)
            if not isinstance(parsed_mapping, dict):
                raise ValueError("Mapping must be a JSON object.")
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid column_mapping JSON format: {str(exc)}"
            )

    result = process_csv_upload(
        file_bytes=file_bytes,
        filename=file.filename,
        column_mapping=parsed_mapping,
        db=db
    )

    if result.errors and result.records_inserted == 0 and result.records_processed > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="; ".join(result.errors)
        )

    return result


@router.get("/preview", response_model=List[Dict[str, Any]])
def get_data_preview(
    batch_id: Optional[str] = Query(None, description="Filter preview by upload batch ID"),
    limit: int = Query(100, ge=1, le=500, description="Max preview rows"),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Retrieve raw sample rows for table previewing."""
    return get_preview(db=db, batch_id=batch_id, limit=limit)


@router.get("/quality", response_model=DataQualityReport)
def get_dataset_quality_assessment(
    db: Session = Depends(get_db)
) -> DataQualityReport:
    """Compute and return data quality metrics on currently stored sales records."""
    return get_data_quality_report(db=db)


@router.get("/records", response_model=SalesRecordListResponse)
def get_paginated_records(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=500, description="Page size"),
    search: Optional[str] = Query(None, description="Search term for order ID, customer, product, city"),
    sort_by: Optional[str] = Query(None, description="Column name to sort by"),
    sort_order: str = Query("asc", pattern="^(asc|desc)$", description="Sort order"),
    start_date: Optional[date] = Query(None, description="Start date filter"),
    end_date: Optional[date] = Query(None, description="End date filter"),
    region: Optional[str] = Query(None, description="Region filter"),
    category: Optional[str] = Query(None, description="Category filter"),
    db: Session = Depends(get_db)
) -> SalesRecordListResponse:
    """Retrieve paginated, filtered, and searchable sales records."""
    filters = DateRangeFilter(
        start_date=start_date,
        end_date=end_date,
        region=region,
        category=category
    )
    result = get_records(
        db=db,
        filters=filters,
        page=page,
        page_size=page_size,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order
    )
    return SalesRecordListResponse(
        data=result["data"],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
        total_pages=result["total_pages"]
    )


@router.get("/filters", response_model=Dict[str, List[str]])
def get_available_filter_options(
    db: Session = Depends(get_db)
) -> Dict[str, List[str]]:
    """Retrieve distinct options for UI filter dropdowns."""
    return {
        "regions": get_distinct_values(db, "region"),
        "categories": get_distinct_values(db, "category"),
        "sub_categories": get_distinct_values(db, "sub_category"),
        "segments": get_distinct_values(db, "segment")
    }


@router.delete("/clear", response_model=Dict[str, Any])
def clear_sales_dataset(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Delete all existing sales data records from the database."""
    return clear_all_data(db=db)
