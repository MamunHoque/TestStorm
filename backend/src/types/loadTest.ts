// Load testing related types
import { HttpMethod, BaseEntity, TestStatus } from './common';
import { AuthenticationConfig } from './auth';

export interface LoadTestConfig {
  name: string;
  description?: string;
  target: LoadTestTarget;
  load: LoadTestLoadConfig;
  authentication: AuthenticationConfig;
  options: LoadTestOptions;
  scenarios?: LoadTestScenario[];
}

export interface LoadTestTarget {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body?: string;
  graphql?: {
    enabled: boolean;
    query: string;
    variables?: Record<string, any>;
  };
}

export interface LoadTestLoadConfig {
  virtualUsers: number; // 1-10,000
  rampUpTime: number; // seconds, 0-300
  duration: number; // seconds, 1-3600
  requestRate?: number; // requests per second
}

export interface LoadTestOptions {
  keepAlive: boolean;
  randomizedDelays: boolean;
  timeout: number; // milliseconds
  followRedirects: boolean;
  validateSSL: boolean;
  regions?: string[]; // for geographic testing
}

export interface LoadTestScenario {
  id: string;
  name: string;
  weight: number; // percentage of traffic
  steps: LoadTestStep[];
}

export interface LoadTestStep {
  id: string;
  name: string;
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: string;
  think_time?: number; // pause between steps in seconds
  assertions?: LoadTestAssertion[];
}

export interface LoadTestAssertion {
  type: 'status_code' | 'response_time' | 'body_contains' | 'header_exists';
  expected: any;
  operator: 'equals' | 'not_equals' | 'less_than' | 'greater_than' | 'contains';
}

// Load test execution and results
export interface LoadTestExecution extends BaseEntity {
  configId: string;
  config: LoadTestConfig;
  status: TestStatus;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number; // actual duration in seconds
  metrics: LoadTestMetrics;
  logs: LoadTestLogEntry[];
  error?: string;
}

export interface LoadTestMetrics {
  summary: LoadTestSummary;
  timeSeries: LoadTestTimeSeriesData[];
  percentiles: LoadTestPercentiles;
  errors: LoadTestErrorSummary[];
}

export interface LoadTestSummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number; // percentage
  averageResponseTime: number; // milliseconds
  maxResponseTime: number; // milliseconds
  minResponseTime: number; // milliseconds
  requestsPerSecond: number;
  bytesReceived: number;
  bytesSent: number;
}

export interface LoadTestTimeSeriesData {
  timestamp: Date;
  requestsPerSecond: number;
  errorsPerSecond: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  activeUsers: number;
}

export interface LoadTestPercentiles {
  p50: number; // median
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  p99_9: number;
}

export interface LoadTestErrorSummary {
  type: string;
  message: string;
  count: number;
  percentage: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
}

export interface LoadTestLogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  method?: HttpMethod;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  userId?: string; // virtual user ID
}

// Real-time monitoring types
export interface LoadTestRealTimeMetrics {
  currentUsers: number;
  requestsPerSecond: number;
  errorsPerSecond: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  successRate: number;
  totalRequests: number;
  elapsedTime: number; // seconds since start
}

// Load test templates and presets
export interface LoadTestTemplate extends BaseEntity {
  name: string;
  description: string;
  category: 'spike' | 'stress' | 'volume' | 'endurance' | 'baseline';
  config: Partial<LoadTestConfig>;
  isPublic: boolean;
  tags: string[];
}

// Load test scheduling
export interface LoadTestSchedule extends BaseEntity {
  name: string;
  configId: string;
  cronExpression: string;
  isActive: boolean;
  nextRun?: Date;
  lastRun?: Date;
  notifications: NotificationConfig[];
}

export interface NotificationConfig {
  type: 'email' | 'slack' | 'webhook';
  target: string;
  events: ('start' | 'complete' | 'error' | 'threshold_breach')[];
}