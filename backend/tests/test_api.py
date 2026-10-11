"""Integration tests for FastAPI REST API endpoints."""

import io
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.database.connection import Base, get_db
from app.models.sales import SalesRecord


# Configure test database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_database():
    """Create fresh tables for each test and bind DB dependency."""
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    """Test client fixture."""
    with TestClient(app) as test_client:
        yield test_client


def test_health_check_returns_200(client):
    """Test that health check endpoint returns status 200 and expected payload."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Sales Analytics Dashboard" in data["app"]


def test_dashboard_summary_returns_valid_structure(client):
    """Test that dashboard summary endpoint returns 200 and schema compliant keys."""
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    expected_keys = {
        "total_revenue", "total_profit", "total_orders",
        "total_units_sold", "avg_order_value", "profit_margin",
        "prev_revenue", "prev_profit", "revenue_change_pct",
        "profit_change_pct", "record_count"
    }
    assert expected_keys.issubset(data.keys())
    assert data["total_revenue"] == 0.0


def test_post_data_upload_with_valid_csv(client):
    """Test uploading a valid CSV via POST /api/data/upload."""
    csv_bytes = (
        "Order ID,Order Date,Sales,Quantity,Profit,Category,Region\n"
        "ORD-101,2023-03-01,150.00,3,30.00,Technology,West\n"
        "ORD-102,2023-03-02,200.00,2,50.00,Furniture,East\n"
    ).encode("utf-8")

    files = {"file": ("test_sales.csv", io.BytesIO(csv_bytes), "text/csv")}
    response = client.post("/api/data/upload", files=files)

    assert response.status_code == 200
    data = response.json()
    assert data["records_processed"] == 2
    assert data["records_inserted"] == 2
    assert "batch_id" in data


def test_get_data_records_pagination(client):
    """Test pagination on GET /api/data/records."""
    # Seed 5 records directly
    db = TestingSessionLocal()
    from datetime import date
    for i in range(1, 6):
        db.add(
            SalesRecord(
                order_id=f"PAGE-ORD-{i}",
                order_date=date(2023, 1, i),
                sales=10.0 * i,
                profit=2.0 * i,
                upload_batch_id="batch-page"
            )
        )
    db.commit()
    db.close()

    response = client.get("/api/data/records?page=1&page_size=2")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 5
    assert len(data["data"]) == 2
    assert data["page"] == 1
    assert data["page_size"] == 2
    assert data["total_pages"] == 3


def test_invalid_date_filter_returns_422(client):
    """Test that passing an invalid date format returns HTTP 422."""
    response = client.get("/api/dashboard/summary?start_date=not-a-real-date")
    assert response.status_code == 422
    data = response.json()
    assert data["error"] is True
    assert data["status_code"] == 422
