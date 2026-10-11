# Sales Analytics Dashboard

A full-stack Sales Data Analysis and Business Insights Dashboard built with React 18, FastAPI, SQLite, and Pandas.

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://typescriptlang.org)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57.svg)](https://sqlite.org)

## 📊 Features

- **Interactive Dashboard** with KPI cards (Revenue, Profit, Orders, Units Sold, AOV, Profit Margin)
- **Revenue Trends** — daily, weekly, monthly line charts
- **Category & Sub-Category Analysis** — grouped bar charts
- **Regional Performance** — revenue and profit by region
- **Top Products** — horizontal bar chart of top 10 by revenue
- **Customer Analysis** — top customers, segments, AOV
- **Profitability Analysis** — identify negative-profit products/categories
- **Business Insights** — rule-based findings from real data
- **CSV Upload** with column mapping and validation
- **Data Quality Module** — missing values, duplicates, invalid data
- **Data Explorer** — searchable, sortable, paginated table with CSV export
- **Reports & Export** — download filtered data and summary reports

## 🛠 Technology Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Recharts, Lucide React |
| Backend | Python 3.11+, FastAPI, Uvicorn, Pydantic |
| Data | Pandas, NumPy |
| Database | SQLite, SQLAlchemy 2.0 |

## 📋 Prerequisites

- **Python 3.11+** — [Download](https://python.org/downloads/)
- **Node.js 18+** — [Download](https://nodejs.org/)
- **npm 9+** — Included with Node.js
- **Git** — [Download](https://git-scm.com/)

## 🚀 Installation (Windows)

### 1. Clone the repository

```bash
git clone <repository-url>
cd sales-analytics-dashboard
```

### 2. Backend Setup

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
copy .env.example .env

# Create the data directory
mkdir data
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
```

## ▶️ Running the Application

### Start the Backend

```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at: http://localhost:8000  
Interactive API docs: http://localhost:8000/docs

### Start the Frontend

Open a new terminal:

```bash
cd frontend
npm run dev
```

The dashboard will be available at: http://localhost:5173

## 📁 Dataset

This application supports the **Sample Superstore** dataset and any similar sales CSV files.

### Download Sample Data

1. Visit [Kaggle Superstore Dataset](https://www.kaggle.com/datasets/vivek468/superstore-dataset-final)
2. Download `Sample - Superstore.csv`
3. Place it in the `data/` directory (optional — you can also upload via the UI)

### Upload via the Dashboard

1. Open the dashboard at http://localhost:5173
2. Navigate to **Settings** or click **Upload CSV** in the header
3. Drag & drop your CSV file
4. Review the auto-detected column mapping and adjust if needed
5. Click **Upload** to process the data

### Required CSV Columns

| Standard Field | Common Variations |
|---------------|-------------------|
| order_id | Order ID, OrderID, order_id |
| order_date | Order Date, OrderDate, Date |
| sales | Sales, Revenue, Amount |

### Optional Columns

`customer_id`, `customer_name`, `segment`, `region`, `category`, `sub_category`, `product_name`, `product_id`, `quantity`, `discount`, `profit`, `ship_date`, `ship_mode`, `city`, `state`, `country`, `postal_code`

> Features that depend on missing columns will show an informative message rather than crashing.

## 🔌 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/dashboard/summary` | KPI summary |
| GET | `/api/dashboard/revenue-trends` | Revenue over time |
| GET | `/api/dashboard/insights` | Business insights |
| GET | `/api/analytics/categories` | Category metrics |
| GET | `/api/analytics/regions` | Region metrics |
| GET | `/api/analytics/top-products` | Top 10 products |
| GET | `/api/analytics/top-customers` | Top customers |
| GET | `/api/analytics/profitability` | Profitability analysis |
| POST | `/api/data/upload` | Upload CSV file |
| GET | `/api/data/records` | Browse records |
| GET | `/api/data/quality` | Data quality report |
| GET | `/api/export/csv` | Download CSV |

### Filter Parameters

All analytics endpoints accept these query parameters:

| Parameter | Type | Example |
|-----------|------|---------|
| `start_date` | date | `2023-01-01` |
| `end_date` | date | `2023-12-31` |
| `region` | string | `West` |
| `category` | string | `Technology` |

## 🧪 Testing

```bash
cd backend
venv\Scripts\activate

# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ -v --cov=app --cov-report=term-missing

# Run specific test file
pytest tests/test_kpi.py -v
```

## 📸 Screenshots

_Upload screenshots to this section after running the application._

- Overview Dashboard
- Sales Analysis
- Product Analysis  
- Customer Analysis
- Regional Analysis
- Data Explorer
- Data Quality

## 🔧 Troubleshooting

### Backend won't start

**Port already in use:**
```bash
uvicorn app.main:app --reload --port 8001
```
Then update `vite.config.ts` proxy target to `http://localhost:8001`.

**Module not found:**
```bash
# Make sure virtual environment is activated
venv\Scripts\activate
pip install -r requirements.txt
```

**SQLite database error:**
```bash
# Delete and recreate the database
del data\sales.db
uvicorn app.main:app --reload
```

### Frontend won't start

**npm install fails:**
```bash
# Clear npm cache
npm cache clean --force
npm install
```

**API calls fail (CORS or 404):**
- Ensure backend is running on port 8000
- Check `vite.config.ts` proxy configuration
- Check browser network tab for the actual error

### Upload fails

- Ensure the CSV uses UTF-8 encoding
- Check file size is under 50 MB
- Verify required columns (order_id, order_date, sales) exist or are mapped correctly

## 📐 Project Structure

```
sales-analytics-dashboard/
├── backend/
│   ├── app/
│   │   ├── api/routes/        # FastAPI route handlers
│   │   ├── analytics/         # Business logic & SQL queries
│   │   ├── core/              # Config & logging
│   │   ├── database/          # SQLAlchemy setup
│   │   ├── models/            # SQLAlchemy ORM models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Data processing & upload
│   │   └── main.py            # FastAPI app entry point
│   ├── tests/                 # Pytest test suite
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Page-level components
│   │   ├── charts/            # Recharts wrappers
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API service functions
│   │   └── types/             # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
├── data/
│   └── README.md
├── .gitignore
├── .env.example
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
