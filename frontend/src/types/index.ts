import { z } from 'zod';
import { 
  GraphQLOperationTypeSchema, 
  GraphQLRequestSchema, 
  GraphQLResponseSchema,
  type GraphQLRequest,
  type GraphQLResponse,
  type GraphQLOperationType,
  GraphQLValidationUtils
} from './graphql';

// HTTP Methods supported by the application
export const HttpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);
export type HttpMethod = z.infer<typeof HttpMethodSchema>;

// API Types
export const ApiTypeSchema = z.enum(['rest', 'graphql']);
export type ApiType = z.infer<typeof ApiTypeSchema>;

// Authentication types
export const AuthTypeSchema = z.enum(['bearer', 'apikey', 'basic']);
export type AuthType = z.infer<typeof AuthTypeSchema>;

// Authentication configuration schema and interface
export const AuthConfigSchema = z.object({
  type: AuthTypeSchema,
  credentials: z.record(z.string(), z.string()),
});
export interface AuthConfig extends z.infer<typeof AuthConfigSchema> {}

// Re-export GraphQL types
export {
  GraphQLOperationTypeSchema,
  GraphQLRequestSchema,
  GraphQLResponseSchema,
};
export type {
  GraphQLRequest,
  GraphQLResponse,
  GraphQLOperationType
};

// API Test Configuration schema and interface
export const ApiTestConfigSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Test name is required').max(100, 'Test name must be less than 100 characters'),
  url: z.string().url('Invalid URL format'),
  apiType: ApiTypeSchema.default('rest'),
  method: HttpMethodSchema,
  headers: z.record(z.string(), z.string()),
  queryParams: z.record(z.string(), z.string()),
  body: z.string().optional(),
  graphql: z.object({
    operationType: GraphQLOperationTypeSchema.default('query'),
    operationName: z.string().optional(),
    query: z.string().optional(),
    variables: z.string().optional(), // JSON string of variables
  }).optional(),
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
  apiType: ApiTypeSchema.default('rest'),
  method: HttpMethodSchema,
  headers: z.record(z.string(), z.string()),
  queryParams: z.record(z.string(), z.string()),
  body: z.string().optional(),
  graphql: z.object({
    operationType: GraphQLOperationTypeSchema.default('query'),
    operationName: z.string().optional(),
    query: z.string().optional(),
    variables: z.string().optional(), // JSON string of variables
  }).optional(),
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

  static validateWebSocketJoinTestEvent(data: unknown): ValidationResult<WebSocketJoinTestEvent> {
    return this.validateData(WebSocketJoinTestEventSchema, data);
  }

  static validateWebSocketLeaveTestEvent(data: unknown): ValidationResult<WebSocketLeaveTestEvent> {
    return this.validateData(WebSocketLeaveTestEventSchema, data);
  }

  static validateWebSocketTestMetricsEvent(data: unknown): ValidationResult<WebSocketTestMetricsEvent> {
    return this.validateData(WebSocketTestMetricsEventSchema, data);
  }

  static validateWebSocketTestCompleteEvent(data: unknown): ValidationResult<WebSocketTestCompleteEvent> {
    return this.validateData(WebSocketTestCompleteEventSchema, data);
  }

  static validateTestHistoryItem(data: unknown): ValidationResult<TestHistoryItem> {
    return this.validateData(TestHistoryItemSchema, data);
  }

  static validateTestHistoryResponse(data: unknown): ValidationResult<TestHistoryResponse> {
    return this.validateData(TestHistoryResponseSchema, data);
  }

  static validateExportConfig(data: unknown): ValidationResult<ExportConfig> {
    return this.validateData(ExportConfigSchema, data);
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

  // GraphQL validation
  static validateGraphQLRequest(request: Partial<GraphQLRequest>): { isValid: boolean; errors?: string[] } {
    const errors: string[] = [];
    
    // Validate query
    if (!request.query || !request.query.trim()) {
      errors.push('GraphQL query is required');
    } else {
      const queryValidation = GraphQLValidationUtils.validateGraphQLQuery(request.query);
      if (!queryValidation.isValid && queryValidation.error) {
        errors.push(queryValidation.error);
      }
    }
    
    // Validate variables if present
    if (request.variables && typeof request.variables === 'string') {
      try {
        JSON.parse(request.variables);
      } catch (error) {
        errors.push('GraphQL variables must be valid JSON');
      }
    }
    
    return {
      isValid: errors.length === 0,
      ...(errors.length > 0 && { errors })
    };
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

// WebSocket event schemas for real-time communication
export const WebSocketJoinTestEventSchema = z.object({
  testId: z.string(),
});
export interface WebSocketJoinTestEvent extends z.infer<typeof WebSocketJoinTestEventSchema> {}

export const WebSocketLeaveTestEventSchema = z.object({
  testId: z.string(),
});
export interface WebSocketLeaveTestEvent extends z.infer<typeof WebSocketLeaveTestEventSchema> {}

export const WebSocketTestMetricsEventSchema = z.object({
  testId: z.string(),
  timestamp: z.number().positive(),
  requestsPerSecond: z.number().min(0),
  averageLatency: z.number().min(0),
  errorRate: z.number().min(0).max(1),
  activeUsers: z.number().int().min(0),
});
export interface WebSocketTestMetricsEvent extends z.infer<typeof WebSocketTestMetricsEventSchema> {}

export const WebSocketTestCompleteEventSchema = z.object({
  testId: z.string(),
  summary: TestSummarySchema,
});
export interface WebSocketTestCompleteEvent extends z.infer<typeof WebSocketTestCompleteEventSchema> {}

// Export history and pagination schemas
export const TestHistoryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  method: HttpMethodSchema,
  status: TestStatusSchema,
  createdAt: z.date(),
  duration: z.number().optional(),
  totalRequests: z.number().int().min(0).optional(),
  errorRate: z.number().min(0).max(1).optional(),
});
export interface TestHistoryItem extends z.infer<typeof TestHistoryItemSchema> {}

export const PaginationSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1).max(100),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});
export interface Pagination extends z.infer<typeof PaginationSchema> {}

export const TestHistoryResponseSchema = z.object({
  items: z.array(TestHistoryItemSchema),
  pagination: PaginationSchema,
});
export interface TestHistoryResponse extends z.infer<typeof TestHistoryResponseSchema> {}

// Export data export schemas
export const ExportConfigSchema = z.object({
  format: z.enum(['csv', 'json']),
  includeMetrics: z.boolean().default(true),
  includeConfig: z.boolean().default(true),
  dateRange: z.object({
    start: z.date().optional(),
    end: z.date().optional(),
  }).optional(),
});
export interface ExportConfig extends z.infer<typeof ExportConfigSchema> {}

// All schemas are already exported above with their definitions
