// Test results and reporting types
import { BaseEntity, ExportFormat } from './common';
// import { LoadTestMetrics, LoadTestConfig } from './loadTest';
// import { ApiTestResult } from './api';

export interface TestResult extends BaseEntity {
  type: 'api' | 'load';
  name: string;
  description?: string;
  config: any; // ApiTestConfig | LoadTestConfig
  metrics: any; // ApiTestMetrics | LoadTestMetrics
  status: 'success' | 'error' | 'partial';
  duration: number; // seconds
  tags: string[];
  isFavorite: boolean;
}

export interface TestResultSummary {
  id: string;
  name: string;
  type: 'api' | 'load';
  status: 'success' | 'error' | 'partial';
  duration: number;
  createdAt: Date;
  key_metrics: {
    responseTime?: number;
    successRate?: number;
    totalRequests?: number;
    statusCode?: number;
  };
}

// Test history and filtering
export interface TestHistoryFilter {
  type?: 'api' | 'load';
  status?: 'success' | 'error' | 'partial';
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  search?: string;
}

export interface TestHistoryResponse {
  results: TestResultSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: TestHistoryFilter;
}

// Report generation
export interface ReportConfig {
  testResultIds: string[];
  format: ExportFormat;
  includeCharts: boolean;
  includeRawData: boolean;
  includeLogs: boolean;
  customSections?: ReportSection[];
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'summary' | 'charts' | 'metrics' | 'logs' | 'recommendations';
  content?: any;
}

export interface GeneratedReport extends BaseEntity {
  name: string;
  config: ReportConfig;
  format: ExportFormat;
  fileUrl: string;
  fileSize: number; // bytes
  status: 'generating' | 'completed' | 'failed';
  error?: string;
}

// Performance analysis
export interface PerformanceAnalysis {
  testResultId: string;
  insights: PerformanceInsight[];
  recommendations: PerformanceRecommendation[];
  bottlenecks: PerformanceBottleneck[];
  trends: PerformanceTrend[];
}

export interface PerformanceInsight {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  category: 'performance' | 'reliability' | 'scalability' | 'security';
  metrics?: Record<string, number>;
}

export interface PerformanceRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: 'infrastructure' | 'application' | 'database' | 'network';
  estimatedImpact: string;
  implementationEffort: 'low' | 'medium' | 'high';
}

export interface PerformanceBottleneck {
  id: string;
  component: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metrics: {
    responseTime?: number;
    errorRate?: number;
    throughput?: number;
  };
  timeRange: {
    start: Date;
    end: Date;
  };
}

export interface PerformanceTrend {
  metric: string;
  direction: 'improving' | 'degrading' | 'stable';
  change: number; // percentage change
  timeframe: string; // e.g., "last 7 days"
  significance: 'low' | 'medium' | 'high';
}

// Comparison and benchmarking
export interface TestComparison {
  baselineId: string;
  comparisonIds: string[];
  metrics: ComparisonMetric[];
  summary: ComparisonSummary;
}

export interface ComparisonMetric {
  name: string;
  baseline: number;
  comparisons: number[];
  unit: string;
  changePercentages: number[];
  trend: 'better' | 'worse' | 'same';
}

export interface ComparisonSummary {
  overallTrend: 'better' | 'worse' | 'mixed' | 'same';
  significantChanges: {
    metric: string;
    change: number;
    impact: 'positive' | 'negative';
  }[];
  recommendations: string[];
}

// Export and sharing
export interface ExportRequest {
  testResultIds: string[];
  format: ExportFormat;
  options: ExportOptions;
}

export interface ExportOptions {
  includeCharts: boolean;
  includeRawData: boolean;
  includeLogs: boolean;
  includeConfig: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  compression?: 'none' | 'zip' | 'gzip';
}

export interface SharedReport extends BaseEntity {
  reportId: string;
  shareToken: string;
  expiresAt?: Date;
  isPublic: boolean;
  allowedEmails?: string[];
  accessCount: number;
  lastAccessedAt?: Date;
}