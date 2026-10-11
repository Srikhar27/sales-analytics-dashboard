"""Time-series revenue and profit trends analytics."""

from datetime import date
from typing import List, Optional, Literal
from sqlalchemy import select, func, distinct
from sqlalchemy.orm import Session
from app.models.sales import SalesRecord
from app.schemas.analytics import RevenueTrendPoint


def get_revenue_trends(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    granularity: Literal["daily", "weekly", "monthly"] = "monthly",
    region: Optional[str] = None,
    category: Optional[str] = None
) -> List[RevenueTrendPoint]:
    """Retrieve revenue, profit, and order trends grouped by time granularity.

    Args:
        db: SQLAlchemy database session.
        start_date: Start date filter.
        end_date: End date filter.
        granularity: Grouping interval ('daily', 'weekly', or 'monthly').
        region: Region filter.
        category: Category filter.

    Returns:
        List[RevenueTrendPoint]: Sorted sequence of chronological trend records.
    """
    if granularity == "daily":
        date_group = func.strftime("%Y-%m-%d", SalesRecord.order_date)
    elif granularity == "weekly":
        date_group = func.strftime("%Y-W%W", SalesRecord.order_date)
    else:
        date_group = func.strftime("%Y-%m", SalesRecord.order_date)

    stmt = select(
        date_group.label("period"),
        func.coalesce(func.sum(SalesRecord.sales), 0.0).label("revenue"),
        func.coalesce(func.sum(SalesRecord.profit), 0.0).label("profit"),
        func.count(distinct(SalesRecord.order_id)).label("orders")
    ).group_by(
        date_group
    ).order_by(
        date_group.asc()
    )

    if start_date:
        stmt = stmt.where(SalesRecord.order_date >= start_date)
    if end_date:
        stmt = stmt.where(SalesRecord.order_date <= end_date)
    if region:
        stmt = stmt.where(SalesRecord.region == region)
    if category:
        stmt = stmt.where(SalesRecord.category == category)

    results = db.execute(stmt).all()

    points: List[RevenueTrendPoint] = []
    for row in results:
        period_str = str(row.period) if row.period else "Unknown"
        rev = round(float(row.revenue), 2)
        prof = round(float(row.profit), 2)
        ords = int(row.orders)
        points.append(
            RevenueTrendPoint(
                date=period_str,
                revenue=rev,
                profit=prof,
                orders=ords
            )
        )

    return points
