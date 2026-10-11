"""Pydantic schemas for analytics endpoints and metrics."""

from typing import List, Dict, Optional, Literal
from pydantic import BaseModel, Field


class KPISummary(BaseModel):
    """High-level KPI metrics summary with period comparison."""

    total_revenue: float = Field(default=0.0, description="Total sales revenue")
    total_profit: float = Field(default=0.0, description="Total net profit")
    total_orders: int = Field(default=0, description="Distinct order count")
    total_units_sold: int = Field(default=0, description="Total quantity of products sold")
    avg_order_value: float = Field(default=0.0, description="Average revenue per distinct order")
    profit_margin: float = Field(default=0.0, description="Profit margin percentage (profit/revenue * 100)")
    prev_revenue: float = Field(default=0.0, description="Previous period revenue")
    prev_profit: float = Field(default=0.0, description="Previous period profit")
    revenue_change_pct: float = Field(default=0.0, description="Percentage change in revenue compared to previous period")
    profit_change_pct: float = Field(default=0.0, description="Percentage change in profit compared to previous period")
    record_count: int = Field(default=0, description="Total number of matching line item rows")


class RevenueTrendPoint(BaseModel):
    """A single data point representing aggregated revenue and profit for a time period."""

    date: str = Field(description="Formatted date or period label (e.g., '2023-01', '2023-01-15')")
    revenue: float = Field(default=0.0, description="Total revenue for the period")
    profit: float = Field(default=0.0, description="Total profit for the period")
    orders: int = Field(default=0, description="Distinct orders in the period")


class CategoryMetric(BaseModel):
    """Performance metrics aggregated by product category or subcategory."""

    category: str = Field(description="Category or Sub-Category name")
    revenue: float = Field(default=0.0)
    profit: float = Field(default=0.0)
    quantity: int = Field(default=0)
    orders: int = Field(default=0)
    profit_margin: float = Field(default=0.0)


class RegionMetric(BaseModel):
    """Performance metrics aggregated by geographical region."""

    region: str = Field(description="Region name")
    revenue: float = Field(default=0.0)
    profit: float = Field(default=0.0)
    quantity: int = Field(default=0)
    orders: int = Field(default=0)
    profit_margin: float = Field(default=0.0)


class ProductMetric(BaseModel):
    """Performance metrics for individual products."""

    product_name: str
    category: str
    revenue: float
    profit: float
    quantity: int
    profit_margin: float


class CustomerMetric(BaseModel):
    """Performance metrics for customer ranking."""

    customer_name: str
    customer_id: str
    revenue: float
    orders: int
    avg_order_value: float
    segment: str


class ProfitabilityItem(BaseModel):
    """Profitability breakdown item for products or categories."""

    name: str
    revenue: float
    profit: float
    profit_margin: float
    is_negative: bool


class BusinessInsight(BaseModel):
    """Rule-based automated actionable business insight."""

    title: str
    description: str
    metric_value: str
    comparison: str
    recommendation: str
    severity: Literal["info", "warning", "critical"]


class DataQualityReport(BaseModel):
    """Data health and quality assessment report."""

    total_records: int = 0
    missing_values: Dict[str, int] = Field(default_factory=dict)
    duplicate_rows: int = 0
    invalid_dates: int = 0
    invalid_numerics: int = 0
    negative_profits: int = 0
    warnings: List[str] = Field(default_factory=list)
