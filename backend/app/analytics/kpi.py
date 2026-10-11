"""KPI calculation logic for sales analytics."""

from datetime import date, timedelta
from typing import Optional
from sqlalchemy import select, func, distinct
from sqlalchemy.orm import Session
from app.models.sales import SalesRecord
from app.schemas.analytics import KPISummary


def calculate_kpis(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    region: Optional[str] = None,
    category: Optional[str] = None
) -> KPISummary:
    """Calculate key performance indicators for sales data over a specified period.

    Args:
        db: SQLAlchemy database session.
        start_date: Start date filter (inclusive).
        end_date: End date filter (inclusive).
        region: Geographic region filter.
        category: Product category filter.

    Returns:
        KPISummary: Aggregated KPI metrics including current values and comparison
                    against the preceding period of identical duration.
    """
    # Base query for current period
    stmt = select(
        func.coalesce(func.sum(SalesRecord.sales), 0.0).label("total_revenue"),
        func.coalesce(func.sum(SalesRecord.profit), 0.0).label("total_profit"),
        func.count(distinct(SalesRecord.order_id)).label("total_orders"),
        func.coalesce(func.sum(SalesRecord.quantity), 0).label("total_units_sold"),
        func.count(SalesRecord.id).label("record_count"),
        func.min(SalesRecord.order_date).label("min_date"),
        func.max(SalesRecord.order_date).label("max_date")
    )

    if start_date:
        stmt = stmt.where(SalesRecord.order_date >= start_date)
    if end_date:
        stmt = stmt.where(SalesRecord.order_date <= end_date)
    if region:
        stmt = stmt.where(SalesRecord.region == region)
    if category:
        stmt = stmt.where(SalesRecord.category == category)

    res = db.execute(stmt).first()

    if not res or res.record_count == 0:
        return KPISummary(
            total_revenue=0.0,
            total_profit=0.0,
            total_orders=0,
            total_units_sold=0,
            avg_order_value=0.0,
            profit_margin=0.0,
            prev_revenue=0.0,
            prev_profit=0.0,
            revenue_change_pct=0.0,
            profit_change_pct=0.0,
            record_count=0
        )

    total_revenue = round(float(res.total_revenue), 2)
    total_profit = round(float(res.total_profit), 2)
    total_orders = int(res.total_orders)
    total_units_sold = int(res.total_units_sold)
    record_count = int(res.record_count)

    # Calculate average order value and profit margin
    avg_order_value = round(total_revenue / total_orders, 2) if total_orders > 0 else 0.0
    profit_margin = round((total_profit / total_revenue) * 100.0, 2) if total_revenue > 0 else 0.0

    # Determine date range for previous period comparison
    eff_start = start_date or res.min_date
    eff_end = end_date or res.max_date

    prev_revenue = 0.0
    prev_profit = 0.0

    if eff_start and eff_end and eff_start <= eff_end:
        duration_days = (eff_end - eff_start).days + 1
        prev_end = eff_start - timedelta(days=1)
        prev_start = prev_end - timedelta(days=duration_days - 1)

        prev_stmt = select(
            func.coalesce(func.sum(SalesRecord.sales), 0.0).label("prev_rev"),
            func.coalesce(func.sum(SalesRecord.profit), 0.0).label("prev_prof")
        ).where(
            SalesRecord.order_date >= prev_start,
            SalesRecord.order_date <= prev_end
        )
        if region:
            prev_stmt = prev_stmt.where(SalesRecord.region == region)
        if category:
            prev_stmt = prev_stmt.where(SalesRecord.category == category)

        prev_res = db.execute(prev_stmt).first()
        if prev_res:
            prev_revenue = round(float(prev_res.prev_rev), 2)
            prev_profit = round(float(prev_res.prev_prof), 2)

    # Compute percentage changes
    if prev_revenue > 0:
        revenue_change_pct = round(((total_revenue - prev_revenue) / prev_revenue) * 100.0, 2)
    elif prev_revenue == 0 and total_revenue > 0:
        revenue_change_pct = 100.0
    else:
        revenue_change_pct = 0.0

    if prev_profit != 0:
        profit_change_pct = round(((total_profit - prev_profit) / abs(prev_profit)) * 100.0, 2)
    elif prev_profit == 0 and total_profit != 0:
        profit_change_pct = 100.0 if total_profit > 0 else -100.0
    else:
        profit_change_pct = 0.0

    return KPISummary(
        total_revenue=total_revenue,
        total_profit=total_profit,
        total_orders=total_orders,
        total_units_sold=total_units_sold,
        avg_order_value=avg_order_value,
        profit_margin=profit_margin,
        prev_revenue=prev_revenue,
        prev_profit=prev_profit,
        revenue_change_pct=revenue_change_pct,
        profit_change_pct=profit_change_pct,
        record_count=record_count
    )
