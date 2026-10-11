"""API routes package."""

from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.analytics import router as analytics_router
from app.api.routes.data import router as data_router
from app.api.routes.export import router as export_router

__all__ = [
    "dashboard_router",
    "analytics_router",
    "data_router",
    "export_router",
]
