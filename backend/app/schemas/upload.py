"""Pydantic schemas for file upload and data mapping."""

from typing import List, Dict, Optional
from pydantic import BaseModel, Field
from app.schemas.analytics import DataQualityReport


class ColumnMapping(BaseModel):
    """Mapping from source CSV header names to target internal model fields."""

    mapping: Dict[str, str] = Field(
        default_factory=dict,
        description="Dictionary mapping CSV header to model column name (e.g., {'Order ID': 'order_id'})"
    )


class UploadResponse(BaseModel):
    """API response returned after file upload and ingestion."""

    batch_id: str
    records_processed: int
    records_inserted: int
    warnings: List[str] = Field(default_factory=list)
    errors: List[str] = Field(default_factory=list)
    quality_report: Optional[DataQualityReport] = None
