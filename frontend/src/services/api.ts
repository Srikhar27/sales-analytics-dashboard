import axios from 'axios';
import {
  KPISummary,
  RevenueTrendPoint,
  CategoryMetric,
  RegionMetric,
  ProductMetric,
  CustomerMetric,
  CustomerSegmentMetric,
  ProfitabilityItem,
  BusinessInsight,
  DataQualityReport,
  PaginatedRecords,
  FilterState,
  FilterOptions,
  HealthResponse,
  UploadResponse,
  SalesRecord,
} from '../types';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 60000,
});

const cleanParams = (params: Record<string, any>) => {
  const cleaned: Record<string, any> = {};
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      cleaned[key] = params[key];
    }
  });
  return cleaned;
};

export const api = {
  getHealth: async (): Promise<HealthResponse> => {
    const response = await apiClient.get<HealthResponse>('/health');
    return response.data;
  },

  getDashboardSummary: async (filters?: Partial<FilterState>): Promise<KPISummary> => {
    const params = cleanParams({
      start_date: filters?.start_date,
      end_date: filters?.end_date,
      region: filters?.region,
      category: filters?.category,
    });
    const response = await apiClient.get<KPISummary>('/dashboard/summary', { params });
    return response.data;
  },

  getRevenueTrends: async (
    filters?: Partial<FilterState>,
    granularity: 'daily' | 'weekly' | 'monthly' = 'monthly'
  ): Promise<RevenueTrendPoint[]> => {
    const params = cleanParams({
      granularity,
      start_date: filters?.start_date,
      end_date: filters?.end_date,
      region: filters?.region,
      category: filters?.category,
    });
    const response = await apiClient.get<RevenueTrendPoint[]>('/dashboard/revenue-trends', { params });
    return response.data;
  },

  getInsights: async (filters?: Partial<FilterState>): Promise<BusinessInsight[]> => {
    const params = cleanParams({
      start_date: filters?.start_date,
      end_date: filters?.end_date,
    });
    const response = await apiClient.get<BusinessInsight[]>('/dashboard/insights', { params });
    return response.data;
  },

  getCategories: async (filters?: Partial<FilterState>): Promise<CategoryMetric[]> => {
    const params = cleanParams({
      start_date: filters?.start_date,
      end_date: filters?.end_date,
      region: filters?.region,
    });
    const response = await apiClient.get<CategoryMetric[]>('/analytics/categories', { params });
    return response.data;
  },

  getSubcategories: async (filters?: Partial<FilterState>): Promise<CategoryMetric[]> => {
    const params = cleanParams({
      start_date: filters?.start_date,
      end_date: filters?.end_date,
      region: filters?.region,
      category: filters?.category,
    });
    const response = await apiClient.get<CategoryMetric[]>('/analytics/subcategories', { params });
    return response.data;
  },

  getRegions: async (filters?: Partial<FilterState>): Promise<RegionMetric[]> => {
    const params = cleanParams({
      start_date: filters?.start_date,
      end_date: filters?.end_date,
      category: filters?.category,
    });
    const response = await apiClient.get<RegionMetric[]>('/analytics/regions', { params });
    return response.data;
  },

  getTopProducts: async (
    filters?: Partial<FilterState>,
    limit: number = 10
  ): Promise<ProductMetric[]> => {
    const params = cleanParams({
      start_date: filters?.start_date,
      end_date: filters?.end_date,
      region: filters?.region,
      category: filters?.category,
      limit,
    });
    const response = await apiClient.get<ProductMetric[]>('/analytics/top-products', { params });
    return response.data;
  },

  getTopCustomers: async (
    filters?: Partial<FilterState>,
    limit: number = 10
  ): Promise<CustomerMetric[]> => {
    const params = cleanParams({
      start_date: filters?.start_date,
      end_date: filters?.end_date,
      region: filters?.region,
      limit,
    });
    const response = await apiClient.get<CustomerMetric[]>('/analytics/top-customers', { params });
    return response.data;
  },

  getProfitability: async (filters?: Partial<FilterState>): Promise<ProfitabilityItem[]> => {
    const params = cleanParams({
      start_date: filters?.start_date,
      end_date: filters?.end_date,
      region: filters?.region,
    });
    const response = await apiClient.get<ProfitabilityItem[]>('/analytics/profitability', { params });
    return response.data;
  },

  getCustomerSegments: async (filters?: Partial<FilterState>): Promise<CustomerSegmentMetric[]> => {
    const params = cleanParams({
      start_date: filters?.start_date,
      end_date: filters?.end_date,
    });
    const response = await apiClient.get<CustomerSegmentMetric[]>('/analytics/customer-segments', { params });
    return response.data;
  },

  uploadCSV: async (file: File, columnMapping?: Record<string, string>): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    if (columnMapping && Object.keys(columnMapping).length > 0) {
      formData.append('column_mapping', JSON.stringify(columnMapping));
    }

    const response = await apiClient.post<UploadResponse>('/data/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getDataPreview: async (batchId?: string, limit: number = 100): Promise<SalesRecord[]> => {
    const params = cleanParams({
      batch_id: batchId,
      limit,
    });
    const response = await apiClient.get<SalesRecord[]>('/data/preview', { params });
    return response.data;
  },

  getDataQuality: async (): Promise<DataQualityReport> => {
    const response = await apiClient.get<DataQualityReport>('/data/quality');
    return response.data;
  },

  getRecords: async (
    filters?: Partial<FilterState>,
    page: number = 1,
    pageSize: number = 50,
    search?: string,
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<PaginatedRecords> => {
    const params = cleanParams({
      page,
      page_size: pageSize,
      search,
      sort_by: sortBy,
      sort_order: sortOrder,
      start_date: filters?.start_date,
      end_date: filters?.end_date,
      region: filters?.region,
      category: filters?.category,
    });
    const response = await apiClient.get<PaginatedRecords>('/data/records', { params });
    return response.data;
  },

  getFilterOptions: async (): Promise<FilterOptions> => {
    const response = await apiClient.get<FilterOptions>('/data/filters');
    return response.data;
  },

  clearData: async (): Promise<{ message: string; rows_deleted: number }> => {
    const response = await apiClient.delete<{ message: string; rows_deleted: number }>('/data/clear');
    return response.data;
  },

  exportCSV: async (
    type: 'records' | 'summary' = 'records',
    filters?: Partial<FilterState>
  ): Promise<void> => {
    const params = cleanParams({
      type,
      start_date: filters?.start_date,
      end_date: filters?.end_date,
      region: filters?.region,
      category: filters?.category,
    });

    const response = await apiClient.get('/export/csv', {
      params,
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', type === 'summary' ? 'sales_summary.csv' : 'sales_records.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  exportQualityReport: async (): Promise<DataQualityReport> => {
    const response = await apiClient.get<DataQualityReport>('/export/quality-report');
    return response.data;
  },
};

export default api;
