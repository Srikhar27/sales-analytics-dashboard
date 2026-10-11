"""Analytics computation package."""

from app.analytics.kpi import calculate_kpis
from app.analytics.trends import get_revenue_trends
from app.analytics.categories import get_category_metrics, get_subcategory_metrics
from app.analytics.regions import get_region_metrics
from app.analytics.products import get_top_products, get_profitability_analysis
from app.analytics.customers import get_top_customers, get_customer_segments
from app.analytics.insights import generate_insights

__all__ = [
    "calculate_kpis",
    "get_revenue_trends",
    "get_category_metrics",
    "get_subcategory_metrics",
    "get_region_metrics",
    "get_top_products",
    "get_profitability_analysis",
    "get_top_customers",
    "get_customer_segments",
    "generate_insights",
]
