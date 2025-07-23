import { z } from 'zod';
import { ApiTestConfig, ApiTestConfigSchema } from './ApiTest';

// Test status enumeration
export const TestStatusSchema = z.enum(['running', 'completed', 'stopped', 'failed']);
export type TestStatus = z.infer<typeof TestStatusSchema>;

// Load Test Configuration schema and interface
export const LoadTestConfigSchema = z.object({
  id: z.string(),
  apiConfig: ApiTestConfigSchema,
  concurrentUsers: z.number().int().min(1, 'At least 1 concurrent user is required').max(10000, 'Maximum 10,000 concurrent users allowed'),
  duration: z.number().int().min(1, 'Duration must be at least 1 second').max(3600, 'Maximum duration is 1 hour (3600 seconds)'),
  rampUpTime: z.number().int().min(0, 'Ramp-up time cannot be negative').max(300, 'Maximum ramp-up time is 5 minutes (300 seconds)'),
  createdAt: z.date(),
}).refine(data => data.rampUpTime < data.duration, {
  message: 'Ramp-up time must be less than test duration',
  path: ['rampUpTime'],
});
export interface LoadTestConfig extends z.infer<typeof LoadTestConfigSchema> {}

// Real-time metric point for charts
export const MetricPointSchema = z.object({
  timestamp: z.number().positive(),
  requestsPerSecond: z.number().min(0),
  averageLatency: z.number().min(0),
  errorRate: z.number().min(0).max(1),
  activeUsers: z.number().int().min(0),
});
export interface MetricPoint extends z.infer<typeof MetricPointSchema> {}

// Test results summary
export const TestSummarySchema = z.object({
  totalRequests: z.number().int().min(0),
  successfulRequests: z.number().int().min(0),
  failedRequests: z.number().int().min(0),
  averageLatency: z.number().min(0),
  p95Latency: z.number().min(0),
  p99Latency: z.number().min(0),
  maxLatency: z.number().min(0),
  requestsPerSecond: z.number().min(0),
  errorRate: z.number().min(0).max(1),
});
export interface TestSummary extends z.infer<typeof TestSummarySchema> {}

// Complete test results schema and interface
export const TestResultsSchema = z.object({
  id: z.string(),
  testConfigId: z.string(),
  startTime: z.date(),
  endTime: z.date(),
  status: TestStatusSchema,
  summary: TestSummarySchema,
  metrics: z.array(MetricPointSchema),
});
export interface TestResults extends z.infer<typeof TestResultsSchema> {}

// Load test start request schema and interface
export const StartLoadTestRequestSchema = z.object({
  target: ApiTestConfigSchema,
  config: z.object({
    concurrentUsers: z.number().int().min(1).max(10000),
    duration: z.number().int().min(1).max(3600),
    rampUpTime: z.number().int().min(0).max(300),
  }),
}).refine(data => data.config.rampUpTime < data.config.duration, {
  message: 'Ramp-up time must be less than test duration',
  path: ['config', 'rampUpTime'],
});
export interface StartLoadTestRequest extends z.infer<typeof StartLoadTestRequestSchema> {}

// Load test start response schema and interface
export const StartLoadTestResponseSchema = z.object({
  testId: z.string(),
  status: z.enum(['started', 'error']),
  message: z.string().optional(),
});
export interface StartLoadTestResponse extends z.infer<typeof StartLoadTestResponseSchema> {}

// Load test stop response schema and interface
export const StopLoadTestResponseSchema = z.object({
  status: z.literal('stopped'),
  finalResults: TestResultsSchema,
});
export interface StopLoadTestResponse extends z.infer<typeof StopLoadTestResponseSchema> {}

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

  // Validate the load test configuration using Zod
  validate(): { isValid: boolean; errors: string[] } {
    try {
      LoadTestConfigSchema.parse(this.config);
      return {
        isValid: true,
        errors: [],
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.issues.map(err => `${err.path.join('.')}: ${err.message}`),
        };
      }
      return {
        isValid: false,
        errors: ['Unknown validation error'],
      };
    }
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