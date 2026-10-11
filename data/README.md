# Data Directory

This directory is used by the application for:

- **SQLite database** (`sales.db`) — created automatically on first run
- **CSV uploads** — temporary storage during processing

## Sample Dataset

This application is designed to work with the **Sample Superstore** sales dataset.

### Download Instructions

1. Go to: https://www.kaggle.com/datasets/vivek468/superstore-dataset-final
2. Sign in to Kaggle (free account required)
3. Click **Download** to get the ZIP file
4. Extract `Sample - Superstore.csv`
5. Upload it via the dashboard UI at http://localhost:5173

### CSV Format

The Superstore dataset includes these columns:

| Column | Type | Description |
|--------|------|-------------|
| Row ID | Integer | Row identifier |
| Order ID | String | Unique order identifier |
| Order Date | Date | Date the order was placed |
| Ship Date | Date | Date the order was shipped |
| Ship Mode | String | Shipping method |
| Customer ID | String | Customer identifier |
| Customer Name | String | Customer full name |
| Segment | String | Customer segment (Consumer/Corporate/Home Office) |
| Country | String | Country |
| City | String | City |
| State | String | State |
| Postal Code | String | ZIP code |
| Region | String | Region (East/West/Central/South) |
| Product ID | String | Product identifier |
| Category | String | Product category |
| Sub-Category | String | Product sub-category |
| Product Name | String | Full product name |
| Sales | Float | Revenue from the transaction |
| Quantity | Integer | Units sold |
| Discount | Float | Discount applied (0-1) |
| Profit | Float | Profit from the transaction |

### Custom Datasets

Any CSV file with these columns (or similar variations) will work.
The application provides a column-mapping UI to handle different column names.

**Required columns:**
- Order ID (or similar)
- Order Date (or similar)
- Sales / Revenue / Amount

**All other columns are optional.**
