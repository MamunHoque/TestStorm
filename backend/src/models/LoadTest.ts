import { ApiTestConfig } from './ApiTest';

// Test status enumeration
export type TestStatus = 'running' | 'completed' | 'stopped' | 'failed';

// Load Test Configuration interface
export interface LoadTestConfig {
  id: string;
  apiConfig: ApiTestConfig;
  concurrentUsers: number;
  duration: number; // in seconds
  rampUpTime: number; // in seconds
  createdAt: Date;
}

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

// Load test start request
export interface StartLoadTestRequest {
  target: ApiTestConfig;
  config: {
    concurrentUsers: number;
    duration: number;
    rampUpTime: number;
  };
}

// Load test start response
export interface StartLoadTestResponse {
  testId: string;
  status: 'started' | 'error';
  message?: string;
}

// Load test stop response
export interface StopLoadTestResponse {
  status: 'stopped';
  finalResults: TestResults;
}

// Load Test class for business logic
export class LoadTest {
  private config: LoadTestConfig;
  private results?: TestResults;
  private status: TestStatus = 'running';

  constructor(config: LoadTestConfig) {
    this.config = {
      ...config,
      id: config.id || this.generateId(),
      createdAt: config.createdAt || new Date(),
    };
  }

  // Generate unique ID for the test
  private generateId(): string {
    return `load_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get test configuration
  getConfig(): LoadTestConfig {
    return { ...this.config };
  }

  // Get test results
  getResults(): TestResults | undefined {
    return this.results ? { ...this.results } : undefined;
  }

  // Get current status
  getStatus(): TestStatus {
    return this.status;
  }

  // Set test status
  setStatus(status: TestStatus): void {
    this.status = status;
  }

  // Initialize test results
  initializeResults(): void {
    this.results = {
      id: this.generateId(),
      testConfigId: this.config.id,
      startTime: new Date(),
      endTime: new Date(), // Will be updated when test completes
      status: 'running',
      summary: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageLatency: 0,
        p95Latency: 0,
        p99Latency: 0,
        maxLatency: 0,
        requestsPerSecond: 0,
        errorRate: 0,
      },
      metrics: [],
    };
  }

  // Add metric point to results
  addMetricPoint(metric: MetricPoint): void {
    if (!this.results) {
      this.initializeResults();
    }
    this.results!.metrics.push(metric);
  }

  // Complete the test and calculate final summary
  completeTest(): void {
    if (!this.results) return;

    this.results.endTime = new Date();
    this.results.status = 'completed';
    this.status = 'completed';

    // Calculate final summary from metrics
    this.results.summary = this.calculateSummary(this.results.metrics);
  }

  // Stop the test early
  stopTest(): void {
    if (!this.results) return;

    this.results.endTime = new Date();
    this.results.status = 'stopped';
    this.status = 'stopped';

    // Calculate summary from available metrics
    this.results.summary = this.calculateSummary(this.results.metrics);
  }

  // Mark test as failed
  failTest(error?: string): void {
    if (!this.results) {
      this.initializeResults();
    }

    this.results!.endTime = new Date();
    this.results!.status = 'failed';
    this.status = 'failed';
  }

  // Calculate test summary from metrics
  private calculateSummary(metrics: MetricPoint[]): TestSummary {
    if (metrics.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageLatency: 0,
        p95Latency: 0,
        p99Latency: 0,
        maxLatency: 0,
        requestsPerSecond: 0,
        errorRate: 0,
      };
    }

    const latencies = metrics.map(m => m.averageLatency);
    const totalRequests = metrics.reduce((sum, m) => sum + m.requestsPerSecond, 0);
    const avgErrorRate = metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length;

    return {
      totalRequests: Math.round(totalRequests),
      successfulRequests: Math.round(totalRequests * (1 - avgErrorRate)),
      failedRequests: Math.round(totalRequests * avgErrorRate),
      averageLatency: latencies.reduce((sum, l) => sum + l, 0) / latencies.length,
      p95Latency: this.calculatePercentile(latencies, 95),
      p99Latency: this.calculatePercentile(latencies, 99),
      maxLatency: Math.max(...latencies),
      requestsPerSecond: totalRequests / metrics.length,
      errorRate: avgErrorRate,
    };
  }

  // Calculate percentile from array of values
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  // Validate the load test configuration
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate concurrent users
    if (this.config.concurrentUsers < 1) {
      errors.push('At least 1 concurrent user is required');
    }
    if (this.config.concurrentUsers > 10000) {
      errors.push('Maximum 10,000 concurrent users allowed');
    }

    // Validate duration
    if (this.config.duration < 1) {
      errors.push('Duration must be at least 1 second');
    }
    if (this.config.duration > 3600) {
      errors.push('Maximum duration is 1 hour (3600 seconds)');
    }

    // Validate ramp-up time
    if (this.config.rampUpTime < 0) {
      errors.push('Ramp-up time cannot be negative');
    }
    if (this.config.rampUpTime > 300) {
      errors.push('Maximum ramp-up time is 5 minutes (300 seconds)');
    }

    // Validate that ramp-up time is not longer than test duration
    if (this.config.rampUpTime >= this.config.duration) {
      errors.push('Ramp-up time must be less than test duration');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Convert to JSON for storage/transmission
  toJSON(): string {
    return JSON.stringify({
      config: {
        ...this.config,
        createdAt: this.config.createdAt.toISOString(),
        apiConfig: {
          ...this.config.apiConfig,
          createdAt: this.config.apiConfig.createdAt.toISOString(),
          updatedAt: this.config.apiConfig.updatedAt.toISOString(),
        },
      },
      results: this.results ? {
        ...this.results,
        startTime: this.results.startTime.toISOString(),
        endTime: this.results.endTime.toISOString(),
      } : undefined,
      status: this.status,
    });
  }

  // Create from JSON
  static fromJSON(json: string): LoadTest {
    const data = JSON.parse(json);
    const loadTest = new LoadTest({
      ...data.config,
      createdAt: new Date(data.config.createdAt),
      apiConfig: {
        ...data.config.apiConfig,
        createdAt: new Date(data.config.apiConfig.createdAt),
        updatedAt: new Date(data.config.apiConfig.updatedAt),
      },
    });

    if (data.results) {
      loadTest.results = {
        ...data.results,
        startTime: new Date(data.results.startTime),
        endTime: new Date(data.results.endTime),
      };
    }

    loadTest.status = data.status;
    return loadTest;
  }
}