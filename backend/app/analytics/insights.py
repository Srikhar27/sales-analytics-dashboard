"""Automated rule-based business insights engine."""

from datetime import date
from typing import List, Optional
from sqlalchemy import select, func, distinct
from sqlalchemy.orm import Session
from app.models.sales import SalesRecord
from app.schemas.analytics import BusinessInsight
from app.analytics.kpi import calculate_kpis
from app.analytics.categories import get_category_metrics
from app.analytics.regions import get_region_metrics
from app.analytics.trends import get_revenue_trends


def generate_insights(
    db: Session,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
) -> List[BusinessInsight]:
    """Generate data-driven business insights based on real sales figures.

    Args:
        db: SQLAlchemy database session.
        start_date: Filter start date.
        end_date: Filter end date.

    Returns:
        List[BusinessInsight]: Actionable insights detected in the data.
    """
    insights: List[BusinessInsight] = []

    # Check overall KPIs first
    kpis = calculate_kpis(db, start_date=start_date, end_date=end_date)
    if kpis.record_count == 0 or kpis.total_revenue <= 0:
        return []

    # 1. Revenue Trend Comparison
    if kpis.prev_revenue > 0:
        rev_change = kpis.revenue_change_pct
        if rev_change <= -15.0:
            insights.append(
                BusinessInsight(
                    title="Significant Revenue Contraction",
                    description=f"Sales revenue dropped by {abs(rev_change):.1f}% compared to the prior period.",
                    metric_value=f"${kpis.total_revenue:,.2f}",
                    comparison=f"Down from ${kpis.prev_revenue:,.2f} ({rev_change:+.1f}%)",
                    recommendation="Review sales pipelines, discounting strategies, and customer retention metrics immediately.",
                    severity="critical" if rev_change <= -25.0 else "warning"
                )
            )
        elif rev_change >= 15.0:
            insights.append(
                BusinessInsight(
                    title="Strong Revenue Growth",
                    description=f"Sales revenue grew by {rev_change:.1f}% compared to the previous period.",
                    metric_value=f"${kpis.total_revenue:,.2f}",
                    comparison=f"Up from ${kpis.prev_revenue:,.2f} ({rev_change:+.1f}%)",
                    recommendation="Capitalize on current momentum by scaling inventory and marketing in top segments.",
                    severity="info"
                )
            )

    # 2. Category Concentration (> 50% revenue in single category)
    categories = get_category_metrics(db, start_date=start_date, end_date=end_date)
    if categories and kpis.total_revenue > 0:
        top_cat = categories[0]
        cat_share = (top_cat.revenue / kpis.total_revenue) * 100.0
        if cat_share >= 50.0 and len(categories) > 1:
            insights.append(
                BusinessInsight(
                    title=f"Category Concentration Risk: {top_cat.category}",
                    description=f"The '{top_cat.category}' category accounts for {cat_share:.1f}% of overall company revenue.",
                    metric_value=f"{cat_share:.1f}% share (${top_cat.revenue:,.2f})",
                    comparison=f"Generates more than half of the total ${kpis.total_revenue:,.2f} sales",
                    recommendation="Diversify product offerings across other categories to reduce revenue reliance on a single sector.",
                    severity="warning"
                )
            )

    # 3. High Revenue, Low Margin Region
    regions = get_region_metrics(db, start_date=start_date, end_date=end_date)
    if regions and kpis.total_revenue > 0:
        for reg in regions:
            reg_share = (reg.revenue / kpis.total_revenue) * 100.0
            if reg_share >= 15.0 and reg.profit_margin < 5.0:
                severity = "critical" if reg.profit < 0 else "warning"
                insights.append(
                    BusinessInsight(
                        title=f"Suboptimal Margins in {reg.region} Region",
                        description=f"The {reg.region} region yields {reg_share:.1f}% of revenue but generates only a {reg.profit_margin:.1f}% profit margin.",
                        metric_value=f"{reg.profit_margin:.1f}% margin",
                        comparison=f"Revenue: ${reg.revenue:,.2f} | Profit: ${reg.profit:,.2f}",
                        recommendation=f"Audit shipping fees, discounts, and high overhead costs in the {reg.region} region.",
                        severity=severity
                    )
                )

    # 4. Products operating at a net loss
    loss_stmt = select(
        SalesRecord.product_name,
        func.sum(SalesRecord.sales).label("prod_sales"),
        func.sum(SalesRecord.profit).label("prod_profit")
    ).group_by(
        SalesRecord.product_name
    ).having(
        func.sum(SalesRecord.profit) < 0
    ).order_by(
        func.sum(SalesRecord.profit).asc()
    )

    if start_date:
        loss_stmt = loss_stmt.where(SalesRecord.order_date >= start_date)
    if end_date:
        loss_stmt = loss_stmt.where(SalesRecord.order_date <= end_date)

    loss_products = db.execute(loss_stmt).all()
    if loss_products:
        loss_count = len(loss_products)
        total_loss = sum(float(r.prod_profit) for r in loss_products)
        worst_product = loss_products[0]
        insights.append(
            BusinessInsight(
                title=f"{loss_count} Loss-Making Product(s) Detected",
                description=f"{loss_count} products have cumulative negative profit totaling ${abs(total_loss):,.2f}.",
                metric_value=f"-${abs(total_loss):,.2f} total loss",
                comparison=f"Worst offender: '{worst_product.product_name}' (-${abs(float(worst_product.prod_profit)):,.2f})",
                recommendation="Re-evaluate pricing, reduce high discounts, or discontinue consistently unprofitable SKUs.",
                severity="critical" if total_loss < -500.0 else "warning"
            )
        )

    # 5. Customer Concentration (Pareto Principle: top 20% customer contribution)
    cust_stmt = select(
        SalesRecord.customer_id,
        func.sum(SalesRecord.sales).label("cust_sales")
    ).group_by(
        SalesRecord.customer_id
    ).order_by(
        func.sum(SalesRecord.sales).desc()
    )
    if start_date:
        cust_stmt = cust_stmt.where(SalesRecord.order_date >= start_date)
    if end_date:
        cust_stmt = cust_stmt.where(SalesRecord.order_date <= end_date)

    customer_sales = db.execute(cust_stmt).all()
    total_cust_count = len(customer_sales)
    if total_cust_count >= 5 and kpis.total_revenue > 0:
        top_20_count = max(1, int(round(total_cust_count * 0.20)))
        top_20_revenue = sum(float(r.cust_sales) for r in customer_sales[:top_20_count])
        top_20_share = (top_20_revenue / kpis.total_revenue) * 100.0

        if top_20_share >= 60.0:
            insights.append(
                BusinessInsight(
                    title="High Customer Revenue Concentration",
                    description=f"The top 20% of customers ({top_20_count} of {total_cust_count}) account for {top_20_share:.1f}% of overall revenue.",
                    metric_value=f"{top_20_share:.1f}% Pareto Share",
                    comparison=f"${top_20_revenue:,.2f} from top {top_20_count} customers",
                    recommendation="Implement dedicated key account management to protect high-value relationships and cultivate mid-tier accounts.",
                    severity="warning" if top_20_share < 80.0 else "critical"
                )
            )

    # 6. Month-over-Month unusual fluctuation in monthly trends
    monthly_trends = get_revenue_trends(db, start_date=start_date, end_date=end_date, granularity="monthly")
    if len(monthly_trends) >= 2:
        last_month = monthly_trends[-1]
        prior_month = monthly_trends[-2]
        if prior_month.revenue > 0:
            mom_pct = ((last_month.revenue - prior_month.revenue) / prior_month.revenue) * 100.0
            if mom_pct <= -30.0:
                insights.append(
                    BusinessInsight(
                        title=f"Sharp Month-Over-Month Decline in {last_month.date}",
                        description=f"Revenue fell {abs(mom_pct):.1f}% from {prior_month.date} to {last_month.date}.",
                        metric_value=f"${last_month.revenue:,.2f}",
                        comparison=f"Previous month was ${prior_month.revenue:,.2f} ({mom_pct:+.1f}%)",
                        recommendation="Investigate supply constraints, marketing campaign completion, or seasonality factors.",
                        severity="warning"
                    )
                )
            elif mom_pct >= 40.0:
                insights.append(
                    BusinessInsight(
                        title=f"Substantial Revenue Spike in {last_month.date}",
                        description=f"Revenue jumped {mom_pct:.1f}% compared to {prior_month.date}.",
                        metric_value=f"${last_month.revenue:,.2f}",
                        comparison=f"Previous month was ${prior_month.revenue:,.2f} ({mom_pct:+.1f}%)",
                        recommendation="Identify high-converting channels or promotions during this spike to replicate success.",
                        severity="info"
                    )
                )

    return insights
