import { z } from 'zod';
import {
  ApiTestConfig,
  ApiTestConfigSchema,
  TestEndpointRequest,
  TestEndpointRequestSchema,
  AuthConfig,
  AuthConfigSchema,
  GraphQLRequest,
  GraphQLRequestSchema,
} from './ApiTest';
import {
  LoadTestConfig,
  LoadTestConfigSchema,
  StartLoadTestRequest,
  StartLoadTestRequestSchema,
  MetricPoint,
  MetricPointSchema,
  TestResults,
  TestResultsSchema,
} from './LoadTest';

// Validation result type
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

// Generic validation function
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
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

// Specific validation functions for each model
export function validateApiTestConfig(data: unknown): ValidationResult<ApiTestConfig> {
  return validateData(ApiTestConfigSchema, data);
}

export function validateTestEndpointRequest(data: unknown): ValidationResult<TestEndpointRequest> {
  return validateData(TestEndpointRequestSchema, data);
}

export function validateAuthConfig(data: unknown): ValidationResult<AuthConfig> {
  return validateData(AuthConfigSchema, data);
}

export function validateGraphQLRequest(data: unknown): ValidationResult<GraphQLRequest> {
  return validateData(GraphQLRequestSchema, data);
}

export function validateLoadTestConfig(data: unknown): ValidationResult<LoadTestConfig> {
  return validateData(LoadTestConfigSchema, data);
}

export function validateStartLoadTestRequest(data: unknown): ValidationResult<StartLoadTestRequest> {
  return validateData(StartLoadTestRequestSchema, data);
}

export function validateMetricPoint(data: unknown): ValidationResult<MetricPoint> {
  return validateData(MetricPointSchema, data);
}

export function validateTestResults(data: unknown): ValidationResult<TestResults> {
  return validateData(TestResultsSchema, data);
}

export function validateWebSocketJoinTestEvent(data: unknown): ValidationResult<WebSocketJoinTestEvent> {
  return validateData(WebSocketJoinTestEventSchema, data);
}

export function validateWebSocketLeaveTestEvent(data: unknown): ValidationResult<WebSocketLeaveTestEvent> {
  return validateData(WebSocketLeaveTestEventSchema, data);
}

export function validateWebSocketTestMetricsEvent(data: unknown): ValidationResult<WebSocketTestMetricsEvent> {
  return validateData(WebSocketTestMetricsEventSchema, data);
}

export function validateWebSocketTestCompleteEvent(data: unknown): ValidationResult<WebSocketTestCompleteEvent> {
  return validateData(WebSocketTestCompleteEventSchema, data);
}

export function validateTestHistoryItem(data: unknown): ValidationResult<TestHistoryItem> {
  return validateData(TestHistoryItemSchema, data);
}

export function validateTestHistoryResponse(data: unknown): ValidationResult<TestHistoryResponse> {
  return validateData(TestHistoryResponseSchema, data);
}

export function validateExportConfig(data: unknown): ValidationResult<ExportConfig> {
  return validateData(ExportConfigSchema, data);
}

// Data transformation utilities
export class DataTransformer {
  // Transform API test config for storage (convert dates to ISO strings)
  static apiTestConfigToStorage(config: ApiTestConfig): Record<string, any> {
    return {
      ...config,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    };
  }

  // Transform API test config from storage (convert ISO strings to dates)
  static apiTestConfigFromStorage(data: Record<string, any>): ApiTestConfig {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    } as ApiTestConfig;
  }

  // Transform load test config for storage
  static loadTestConfigToStorage(config: LoadTestConfig): Record<string, any> {
    return {
      ...config,
      createdAt: config.createdAt.toISOString(),
      apiConfig: this.apiTestConfigToStorage(config.apiConfig),
    };
  }

  // Transform load test config from storage
  static loadTestConfigFromStorage(data: Record<string, any>): LoadTestConfig {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      apiConfig: this.apiTestConfigFromStorage(data.apiConfig),
    } as LoadTestConfig;
  }

  // Transform test results for storage
  static testResultsToStorage(results: TestResults): Record<string, any> {
    return {
      ...results,
      startTime: results.startTime.toISOString(),
      endTime: results.endTime.toISOString(),
    };
  }

  // Transform test results from storage
  static testResultsFromStorage(data: Record<string, any>): TestResults {
    return {
      ...data,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
    } as TestResults;
  }

  // Sanitize authentication credentials for logging (remove sensitive data)
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

  // Sanitize API test config for logging
  static sanitizeApiTestConfig(config: ApiTestConfig): Record<string, any> {
    return {
      ...config,
      authentication: this.sanitizeAuthConfig(config.authentication),
    };
  }

  // Generate unique ID with prefix
  static generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  // Calculate percentile from array of numbers
  static calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  // Calculate average from array of numbers
  static calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  // Calculate error rate from success and total counts
  static calculateErrorRate(successCount: number, totalCount: number): number {
    if (totalCount === 0) return 0;
    return Math.max(0, Math.min(1, (totalCount - successCount) / totalCount));
  }

  // Validate URL format and protocol
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

  // Validate JSON string
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
  
  // Validate GraphQL query syntax (basic validation)
  static validateGraphQLQuery(query: string): { isValid: boolean; error?: string } {
    // Basic validation - check for required keywords and balanced braces
    if (!query.trim()) {
      return { isValid: false, error: 'GraphQL query cannot be empty' };
    }

    // Check for query or mutation keyword
    const hasQueryKeyword = /query\s*(\w+)?\s*(\([^)]*\))?\s*\{/.test(query) || /\{\s*\w+/.test(query);
    const hasMutationKeyword = /mutation\s*(\w+)?\s*(\([^)]*\))?\s*\{/.test(query);
    
    if (!hasQueryKeyword && !hasMutationKeyword) {
      return { 
        isValid: false, 
        error: 'GraphQL query must start with "query" or "mutation" keyword or a selection set' 
      };
    }

    // Check for balanced braces
    let braceCount = 0;
    for (const char of query) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
      if (braceCount < 0) {
        return { isValid: false, error: 'Unbalanced braces in GraphQL query' };
      }
    }

    if (braceCount !== 0) {
      return { isValid: false, error: 'Unbalanced braces in GraphQL query' };
    }

    return { isValid: true };
  }

  // Parse variables from JSON string
  static parseGraphQLVariables(variablesStr: string): { isValid: boolean; variables?: Record<string, any>; error?: string } {
    if (!variablesStr.trim()) {
      return { isValid: true, variables: {} };
    }

    try {
      const variables = JSON.parse(variablesStr);
      if (typeof variables !== 'object' || variables === null || Array.isArray(variables)) {
        return { 
          isValid: false, 
          error: 'GraphQL variables must be a JSON object' 
        };
      }
      return { isValid: true, variables };
    } catch (error) {
      return { 
        isValid: false, 
        error: error instanceof Error ? error.message : 'Invalid JSON format for GraphQL variables' 
      };
    }
  }

  // Deep clone object
  static deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  // Merge objects with type safety
  static mergeObjects<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    return { ...target, ...source };
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
  summary: z.object({
    totalRequests: z.number().int().min(0),
    successfulRequests: z.number().int().min(0),
    failedRequests: z.number().int().min(0),
    averageLatency: z.number().min(0),
    p95Latency: z.number().min(0),
    p99Latency: z.number().min(0),
    maxLatency: z.number().min(0),
    requestsPerSecond: z.number().min(0),
    errorRate: z.number().min(0).max(1),
  }),
});
export interface WebSocketTestCompleteEvent extends z.infer<typeof WebSocketTestCompleteEventSchema> {}

// History and pagination schemas
export const TestHistoryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  status: z.enum(['running', 'completed', 'stopped', 'failed']),
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

// Data export schemas
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

// Export commonly used schemas for external validation
export {
  ApiTestConfigSchema,
  TestEndpointRequestSchema,
  AuthConfigSchema,
  LoadTestConfigSchema,
  StartLoadTestRequestSchema,
  MetricPointSchema,
  TestResultsSchema,
};