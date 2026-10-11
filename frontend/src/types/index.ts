export interface KPISummary {
  total_revenue: number;
  total_profit: number;
  total_orders: number;
  total_units_sold: number;
  avg_order_value: number;
  profit_margin: number;
  prev_revenue: number;
  prev_profit: number;
  revenue_change_pct: number | null;
  profit_change_pct: number | null;
  record_count: number;
}

export interface RevenueTrendPoint {
  date: string;
  revenue: number;
  profit: number;
  orders: number;
}

export interface CategoryMetric {
  category: string;
  revenue: number;
  profit: number;
  quantity: number;
  orders: number;
  profit_margin: number;
}

export interface SubCategoryMetric {
  sub_category: string;
  category: string;
  revenue: number;
  profit: number;
  quantity: number;
  orders: number;
  profit_margin: number;
}

export interface RegionMetric {
  region: string;
  revenue: number;
  profit: number;
  quantity: number;
  orders: number;
  profit_margin: number;
}

export interface ProductMetric {
  product_name: string;
  category: string;
  revenue: number;
  profit: number;
  quantity: number;
  profit_margin: number;
}

export interface CustomerMetric {
  customer_name: string;
  customer_id: string;
  revenue: number;
  orders: number;
  avg_order_value: number;
  segment: string;
}

export interface CustomerSegmentMetric {
  segment: string;
  revenue: number;
  orders: number;
  customers: number;
  avg_order_value: number;
  profit: number;
  profit_margin: number;
}

export interface ProfitabilityItem {
  name: string;
  revenue: number;
  profit: number;
  profit_margin: number;
  is_negative: boolean;
}

export interface BusinessInsight {
  title: string;
  description: string;
  metric_value: string;
  comparison: string;
  recommendation: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface DataQualityReport {
  total_records: number;
  missing_values: Record<string, number>;
  duplicate_rows: number;
  invalid_dates: number;
  invalid_numerics: number;
  negative_profits: number;
  warnings: string[];
}

export interface SalesRecord {
  id: number;
  order_id: string;
  order_date: string;
  customer_name: string;
  customer_id: string;
  segment: string;
  region: string;
  category: string;
  sub_category: string;
  product_name: string;
  sales: number;
  quantity: number;
  discount: number;
  profit: number;
}

export interface PaginatedRecords {
  data: SalesRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface FilterState {
  start_date: string;
  end_date: string;
  region: string;
  category: string;
}

export interface FilterOptions {
  regions: string[];
  categories: string[];
  sub_categories: string[];
  segments: string[];
}

export interface HealthResponse {
  status: string;
  app: string;
  debug: boolean;
}

export interface UploadResponse {
  batch_id: string;
  records_processed: number;
  records_inserted: number;
  warnings: string[];
  errors: string[];
  quality_report?: DataQualityReport;
}
