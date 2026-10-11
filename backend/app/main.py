"""FastAPI application entrypoint and middleware configuration."""

from contextlib import asynccontextmanager
import logging
from typing import AsyncGenerator
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.logging_config import setup_logging
from app.database.init_db import init_db
from app.api.routes import (
    dashboard_router,
    analytics_router,
    data_router,
    export_router,
)

setup_logging(debug=settings.DEBUG)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan context manager for startup and shutdown events."""
    logger.info("Initializing database tables and storage...")
    init_db()
    logger.info("Database initialized successfully.")
    yield
    logger.info("Application shutting down.")


app = FastAPI(
    title=settings.APP_NAME,
    description="Production-ready REST API for sales analytics, reporting, and CSV ingestion.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.ALLOWED_ORIGINS),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with /api prefix
app.include_router(dashboard_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(data_router, prefix="/api")
app.include_router(export_router, prefix="/api")


@app.get("/api/health", tags=["Health"])
def health_check() -> dict:
    """Service health and liveness check endpoint."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "debug": settings.DEBUG
    }


# Custom Exception Handlers
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Handle standard HTTP exceptions with structured JSON error payload."""
    logger.warning("HTTP error on %s %s: %s", request.method, request.url.path, exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "status_code": exc.status_code,
            "message": exc.detail
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle request validation errors with clear error details."""
    logger.warning("Validation error on %s %s: %s", request.method, request.url.path, exc.errors())
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": True,
            "status_code": status.HTTP_422_UNPROCESSABLE_ENTITY,
            "message": "Validation error in request parameters or body.",
            "details": exc.errors()
        }
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle uncaught internal exceptions."""
    logger.error("Unhandled exception on %s %s: %s", request.method, request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": True,
            "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "message": "An internal server error occurred."
        }
    )
