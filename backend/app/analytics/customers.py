"""Customer analytics and segmentation metrics."""

from datetime import date
from typing import List, Dict, Any, Optional
from sqlalchemy import select, func, distinct
from sqlalchemy.orm import Session
from app.models.sales import SalesRecord
from app.schemas.analytics import CustomerMetric


def get_top_customers(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    region: Optional[str] = None,
    limit: int = 10
) -> List[CustomerMetric]:
    """Retrieve top customers ranked by total sales revenue.

    Args:
        db: SQLAlchemy database session.
        start_date: Start date filter.
        end_date: End date filter.
        region: Geographic region filter.
        limit: Number of customers to return.

    Returns:
        List[CustomerMetric]: Top customers with metrics.
    """
    stmt = select(
        func.coalesce(SalesRecord.customer_id, "Unknown").label("cust_id"),
        func.max(func.coalesce(SalesRecord.customer_name, "Unknown Customer")).label("cust_name"),
        func.max(func.coalesce(SalesRecord.segment, "Consumer")).label("seg"),
        func.coalesce(func.sum(SalesRecord.sales), 0.0).label("revenue"),
        func.count(distinct(SalesRecord.order_id)).label("orders")
    ).group_by(
        SalesRecord.customer_id
    ).order_by(
        func.sum(SalesRecord.sales).desc()
    ).limit(limit)

    if start_date:
        stmt = stmt.where(SalesRecord.order_date >= start_date)
    if end_date:
        stmt = stmt.where(SalesRecord.order_date <= end_date)
    if region:
        stmt = stmt.where(SalesRecord.region == region)

    rows = db.execute(stmt).all()

    customers: List[CustomerMetric] = []
    for r in rows:
        rev = round(float(r.revenue), 2)
        ords = int(r.orders)
        aov = round(rev / ords, 2) if ords > 0 else 0.0

        customers.append(
            CustomerMetric(
                customer_id=str(r.cust_id),
                customer_name=str(r.cust_name),
                segment=str(r.seg),
                revenue=rev,
                orders=ords,
                avg_order_value=aov
            )
        )

    return customers


def get_customer_segments(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> List[Dict[str, Any]]:
    """Aggregate customer segments by revenue, profit, customer count, and orders.

    Args:
        db: SQLAlchemy database session.
        start_date: Start date filter.
        end_date: End date filter.

    Returns:
        List[Dict[str, Any]]: Customer segment performance breakdown.
    """
    stmt = select(
        func.coalesce(SalesRecord.segment, "Other").label("segment"),
        func.coalesce(func.sum(SalesRecord.sales), 0.0).label("revenue"),
        func.coalesce(func.sum(SalesRecord.profit), 0.0).label("profit"),
        func.count(distinct(SalesRecord.order_id)).label("orders"),
        func.count(distinct(SalesRecord.customer_id)).label("customers")
    ).group_by(
        SalesRecord.segment
    ).order_by(
        func.sum(SalesRecord.sales).desc()
    )

    if start_date:
        stmt = stmt.where(SalesRecord.order_date >= start_date)
    if end_date:
        stmt = stmt.where(SalesRecord.order_date <= end_date)

    rows = db.execute(stmt).all()

    segments: List[Dict[str, Any]] = []
    for r in rows:
        rev = round(float(r.revenue), 2)
        prof = round(float(r.profit), 2)
        ords = int(r.orders)
        custs = int(r.customers)
        margin = round((prof / rev) * 100.0, 2) if rev > 0 else 0.0
        aov = round(rev / ords, 2) if ords > 0 else 0.0

        segments.append({
            "segment": str(r.segment),
            "revenue": rev,
            "profit": prof,
            "orders": ords,
            "customers": custs,
            "profit_margin": margin,
            "avg_order_value": aov
        })

    return segments
