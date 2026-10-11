"""Pydantic schemas for sales records and query parameters."""

from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class SalesRecordBase(BaseModel):
    """Base schema for sales record attributes."""

    order_id: str
    order_date: date
    ship_date: Optional[date] = None
    ship_mode: Optional[str] = None
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    segment: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    region: Optional[str] = None
    product_id: Optional[str] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    product_name: Optional[str] = None
    sales: float
    quantity: Optional[int] = None
    discount: Optional[float] = None
    profit: Optional[float] = None


class SalesRecordCreate(SalesRecordBase):
    """Schema for creating a new sales record."""

    upload_batch_id: str


class SalesRecordResponse(SalesRecordBase):
    """Schema for returning sales record data in API responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    upload_batch_id: str
    created_at: datetime


class SalesRecordListResponse(BaseModel):
    """Schema for paginated sales records response."""

    data: List[SalesRecordResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class DateRangeFilter(BaseModel):
    """Filter parameters for querying sales records."""

    start_date: Optional[date] = None
    end_date: Optional[date] = None
    region: Optional[str] = None
    category: Optional[str] = None


class PaginationParams(BaseModel):
    """Standard pagination query parameters."""

    page: int = Field(default=1, ge=1, description="Page number starting at 1")
    page_size: int = Field(default=50, ge=1, le=500, description="Items per page")
