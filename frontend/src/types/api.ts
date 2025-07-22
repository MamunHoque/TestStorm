// HTTP Methods supported by the application
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Authentication types
export type AuthType = 'bearer' | 'apikey' | 'basic';

// Authentication configuration interface
export interface AuthConfig {
  type: AuthType;
  credentials: Record<string, string>;
}

// API Test Configuration interface
export interface ApiTestConfig {
  id?: string;
  name: string;
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body?: string;
  authentication?: AuthConfig;
  createdAt: Date;
  updatedAt: Date;
}

// API Test Response interface
export interface ApiTestResponse {
  statusCode: number;
  responseTime: number;
  headers: Record<string, string>;
  body: any;
  error?: string;
  timestamp: Date;
}

// Load Test Configuration interface
export interface LoadTestConfig {
  id: string;
  apiConfig: ApiTestConfig;
  concurrentUsers: number;
  duration: number; // in seconds
  rampUpTime: number; // in seconds
  createdAt: Date;
}

// Test status enumeration
export type TestStatus = 'running' | 'completed' | 'stopped' | 'failed';

// Real-time metric point for charts
export interface MetricPoint {
  timestamp: number;
  requestsPerSecond: number;
  averageLatency: number;
  errorRate: number;
  activeUsers: number;
}

// Test results summary
export interface TestSummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  maxLatency: number;
  requestsPerSecond: number;
  errorRate: number;
}

// Complete test results interface
export interface TestResults {
  id: string;
  testConfigId: string;
  startTime: Date;
  endTime: Date;
  status: TestStatus;
  summary: TestSummary;
  metrics: MetricPoint[];
}

// WebSocket event types
export interface WebSocketEvents {
  // Client to Server
  'join-test': { testId: string };
  'leave-test': { testId: string };
  
  // Server to Client
  'test-metrics': {
    testId: string;
    timestamp: number;
    requestsPerSecond: number;
    averageLatency: number;
    errorRate: number;
    activeUsers: number;
  };
  'test-complete': {
    testId: string;
    summary: TestSummary;
  };
}

// API endpoint request/response types
export interface TestEndpointRequest {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body?: string;
  auth?: AuthConfig;
}

export interface TestEndpointResponse {
  statusCode: number;
  responseTime: number;
  headers: Record<string, string>;
  body: any;
  error?: string;
}

export interface StartLoadTestRequest {
  target: ApiTestConfig;
  config: {
    concurrentUsers: number;
    duration: number;
    rampUpTime: number;
  };
}

export interface StartLoadTestResponse {
  testId: string;
  status: 'started' | 'error';
  message?: string;
}

export interface StopLoadTestResponse {
  status: 'stopped';
  finalResults: TestResults;
}