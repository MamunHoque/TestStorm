import { z } from 'zod';

// HTTP Methods supported by the application
export const HttpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);
export type HttpMethod = z.infer<typeof HttpMethodSchema>;

// Authentication types
export const AuthTypeSchema = z.enum(['bearer', 'apikey', 'basic']);
export type AuthType = z.infer<typeof AuthTypeSchema>;

// Authentication configuration schema and interface
export const AuthConfigSchema = z.object({
  type: AuthTypeSchema,
  credentials: z.record(z.string(), z.string()),
});
export interface AuthConfig extends z.infer<typeof AuthConfigSchema> {}

// API Test Configuration schema and interface
export const ApiTestConfigSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Test name is required').max(100, 'Test name must be less than 100 characters'),
  url: z.string().url('Invalid URL format'),
  method: HttpMethodSchema,
  headers: z.record(z.string(), z.string()),
  queryParams: z.record(z.string(), z.string()),
  body: z.string().optional(),
  authentication: AuthConfigSchema.optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export interface ApiTestConfig extends z.infer<typeof ApiTestConfigSchema> {}

// API Test Response schema and interface
export const ApiTestResponseSchema = z.object({
  statusCode: z.number().int().min(100).max(599),
  responseTime: z.number().positive(),
  headers: z.record(z.string(), z.string()),
  body: z.any(),
  error: z.string().optional(),
  timestamp: z.date(),
});
export interface ApiTestResponse extends z.infer<typeof ApiTestResponseSchema> {}

// Test endpoint request schema and interface
export const TestEndpointRequestSchema = z.object({
  url: z.string().url('Invalid URL format'),
  method: HttpMethodSchema,
  headers: z.record(z.string(), z.string()),
  queryParams: z.record(z.string(), z.string()),
  body: z.string().optional(),
  auth: AuthConfigSchema.optional(),
});
export interface TestEndpointRequest extends z.infer<typeof TestEndpointRequestSchema> {}

// Test endpoint response schema and interface
export const TestEndpointResponseSchema = z.object({
  statusCode: z.number().int().min(100).max(599),
  responseTime: z.number().positive(),
  headers: z.record(z.string(), z.string()),
  body: z.any(),
  error: z.string().optional(),
});
export interface TestEndpointResponse extends z.infer<typeof TestEndpointResponseSchema> {}

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

// Validation result type
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

// Frontend-specific utility functions
export class ValidationUtils {
  // Generic validation function
  static validateData<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
    try {
      const validatedData = schema.parse(data);
      return {
        success: true,
        data: validatedData,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          errors: error.issues.map(err => `${err.path.join('.')}: ${err.message}`),
        };
      }
      return {
        success: false,
        errors: ['Unknown validation error'],
      };
    }
  }

  // Specific validation functions
  static validateApiTestConfig(data: unknown): ValidationResult<ApiTestConfig> {
    return this.validateData(ApiTestConfigSchema, data);
  }

  static validateTestEndpointRequest(data: unknown): ValidationResult<TestEndpointRequest> {
    return this.validateData(TestEndpointRequestSchema, data);
  }

  static validateLoadTestConfig(data: unknown): ValidationResult<LoadTestConfig> {
    return this.validateData(LoadTestConfigSchema, data);
  }

  static validateStartLoadTestRequest(data: unknown): ValidationResult<StartLoadTestRequest> {
    return this.validateData(StartLoadTestRequestSchema, data);
  }

  // URL validation
  static validateUrl(url: string): { isValid: boolean; error?: string } {
    try {
      const parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return {
          isValid: false,
          error: 'URL must use HTTP or HTTPS protocol',
        };
      }
      return { isValid: true };
    } catch {
      return {
        isValid: false,
        error: 'Invalid URL format',
      };
    }
  }

  // JSON validation
  static validateJson(jsonString: string): { isValid: boolean; error?: string; parsed?: any } {
    try {
      const parsed = JSON.parse(jsonString);
      return {
        isValid: true,
        parsed,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Invalid JSON format',
      };
    }
  }

  // Sanitize auth config for display (remove sensitive data)
  static sanitizeAuthConfig(auth?: AuthConfig): Record<string, any> | undefined {
    if (!auth) return undefined;

    const sanitized: Record<string, any> = {
      type: auth.type,
      credentials: {},
    };

    switch (auth.type) {
      case 'bearer':
        sanitized.credentials = { token: '[REDACTED]' };
        break;
      case 'apikey':
        sanitized.credentials = {
          key: auth.credentials.key,
          value: '[REDACTED]',
        };
        break;
      case 'basic':
        sanitized.credentials = {
          username: auth.credentials.username,
          password: '[REDACTED]',
        };
        break;
    }

    return sanitized;
  }
}

// All schemas are already exported above with their definitions
