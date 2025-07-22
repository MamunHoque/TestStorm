// Theme types
export type Theme = 'light' | 'dark';

// Application panel types
export type AppPanel = 'api-test' | 'load-test' | 'dashboard' | 'history';

// Form validation error types
export interface FormError {
  field: string;
  message: string;
}

// Loading states for different operations
export interface LoadingStates {
  apiTest: boolean;
  loadTest: boolean;
  history: boolean;
  export: boolean;
}

// Notification types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  timestamp: Date;
}

// Chart data types for visualization
export interface ChartDataPoint {
  timestamp: number;
  value: number;
  label?: string;
}

export interface ChartConfig {
  title: string;
  yAxisLabel: string;
  color: string;
  showGrid: boolean;
  showTooltip: boolean;
}

// Export configuration
export type ExportFormat = 'csv' | 'json';

export interface ExportConfig {
  format: ExportFormat;
  includeMetrics: boolean;
  includeConfig: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Pagination for history
export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
}

// Filter options for test history
export interface HistoryFilter {
  status?: TestStatus[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchTerm?: string;
}