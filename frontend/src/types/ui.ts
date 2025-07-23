// UI-specific types for the frontend application

// Theme types
export type Theme = 'light' | 'dark';

// Application panel types
export type AppPanel = 'api-test' | 'load-test' | 'dashboard' | 'history';

// UI state types
export interface UIState {
  activePanel: AppPanel;
  theme: Theme;
  isLoading: boolean;
  error?: string;
}

// Navigation item type
export interface NavigationItem {
  id: AppPanel;
  label: string;
  icon?: string;
  disabled?: boolean;
}

// Form field types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

// Modal types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Toast notification types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Loading state types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

// Error state types
export interface ErrorState {
  hasError: boolean;
  message?: string;
  details?: string[];
  code?: string | number;
}

// Chart data types
export interface ChartDataPoint {
  timestamp: number;
  value: number;
  label?: string;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color?: string;
}

// Table types
export interface TableColumn<T = any> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  sortBy?: keyof T;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: keyof T) => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

// Pagination types
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Export all types
export type {
  Theme,
  AppPanel,
  UIState,
  NavigationItem,
  FormField,
  ModalProps,
  ToastType,
  Toast,
  LoadingState,
  ErrorState,
  ChartDataPoint,
  ChartSeries,
  TableColumn,
  TableProps,
  PaginationProps,
  ValidationError,
  FormValidationResult,
};