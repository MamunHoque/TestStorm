// Common types used across the application

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export type TestStatus = 'idle' | 'running' | 'completed' | 'failed' | 'stopped';

export type ExportFormat = 'json' | 'csv' | 'pdf';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ErrorResponse {
  status: 'error';
  statusCode: number;
  message: string;
  errors?: ValidationError[];
  timestamp: string;
  stack?: string; // Only in development
}