import { z } from 'zod';
import {
  ApiTestConfig,
  ApiTestConfigSchema,
  TestEndpointRequest,
  TestEndpointRequestSchema,
  AuthConfig,
  AuthConfigSchema,
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
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

  // Deep clone object
  static deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  // Merge objects with type safety
  static mergeObjects<T extends Record<string, any>>(target: T, source: Partial<T>): T {
    return { ...target, ...source };
  }
}

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