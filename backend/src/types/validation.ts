// Validation schemas and functions using Zod
import { z } from 'zod';

// Common validation schemas
export const HttpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']);

export const TestStatusSchema = z.enum(['idle', 'running', 'completed', 'failed', 'stopped']);

export const ExportFormatSchema = z.enum(['json', 'csv', 'pdf']);

// URL validation with proper protocol check
export const UrlSchema = z.string()
  .url('Invalid URL format')
  .refine((url) => {
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }, 'URL must use HTTP or HTTPS protocol');

// Authentication validation schemas
export const AuthTypeSchema = z.enum(['none', 'bearer', 'apikey', 'basic']);

export const BearerTokenAuthSchema = z.object({
  type: z.literal('bearer'),
  token: z.string().min(1, 'Bearer token is required'),
});

export const ApiKeyAuthSchema = z.object({
  type: z.literal('apikey'),
  apiKey: z.string().min(1, 'API key is required'),
  apiKeyHeader: z.string().min(1, 'API key header is required'),
});

export const BasicAuthSchema = z.object({
  type: z.literal('basic'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const NoAuthSchema = z.object({
  type: z.literal('none'),
});

export const AuthenticationConfigSchema = z.discriminatedUnion('type', [
  NoAuthSchema,
  BearerTokenAuthSchema,
  ApiKeyAuthSchema,
  BasicAuthSchema,
]);

// API Test validation schemas
export const ApiTestConfigSchema = z.object({
  url: UrlSchema,
  method: HttpMethodSchema,
  headers: z.record(z.string()).default({}),
  queryParams: z.record(z.string()).default({}),
  body: z.string().optional(),
  authentication: AuthenticationConfigSchema,
  timeout: z.number().min(1000).max(300000).default(30000), // 1s to 5min
  followRedirects: z.boolean().default(true),
  validateSSL: z.boolean().default(true),
});

export const GraphQLConfigSchema = z.object({
  enabled: z.boolean(),
  query: z.string().min(1, 'GraphQL query is required when enabled'),
  variables: z.record(z.any()).optional(),
  operationName: z.string().optional(),
});

// Load Test validation schemas
export const LoadTestTargetSchema = z.object({
  url: UrlSchema,
  method: HttpMethodSchema,
  headers: z.record(z.string()).default({}),
  body: z.string().optional(),
  graphql: GraphQLConfigSchema.optional(),
});

export const LoadTestLoadConfigSchema = z.object({
  virtualUsers: z.number()
    .min(1, 'At least 1 virtual user is required')
    .max(10000, 'Maximum 10,000 virtual users allowed'),
  rampUpTime: z.number()
    .min(0, 'Ramp-up time cannot be negative')
    .max(300, 'Maximum ramp-up time is 300 seconds'),
  duration: z.number()
    .min(1, 'Minimum test duration is 1 second')
    .max(3600, 'Maximum test duration is 3600 seconds (1 hour)'),
  requestRate: z.number().positive().optional(),
});

export const LoadTestOptionsSchema = z.object({
  keepAlive: z.boolean().default(true),
  randomizedDelays: z.boolean().default(false),
  timeout: z.number().min(1000).max(300000).default(30000),
  followRedirects: z.boolean().default(true),
  validateSSL: z.boolean().default(true),
  regions: z.array(z.string()).optional(),
});

export const LoadTestConfigSchema = z.object({
  name: z.string().min(1, 'Test name is required').max(100, 'Test name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  target: LoadTestTargetSchema,
  load: LoadTestLoadConfigSchema,
  authentication: AuthenticationConfigSchema,
  options: LoadTestOptionsSchema,
});

// Validation helper functions
export class ValidationError extends Error {
  public readonly errors: z.ZodError;

  constructor(errors: z.ZodError) {
    super('Validation failed');
    this.errors = errors;
    this.name = 'ValidationError';
  }

  public getFormattedErrors() {
    return this.errors.errors.map(error => ({
      field: error.path.join('.'),
      message: error.message,
      code: error.code,
    }));
  }
}

export function validateApiTestConfig(data: unknown) {
  try {
    return ApiTestConfigSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error);
    }
    throw error;
  }
}

export function validateLoadTestConfig(data: unknown) {
  try {
    return LoadTestConfigSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error);
    }
    throw error;
  }
}

export function validateAuthConfig(data: unknown) {
  try {
    return AuthenticationConfigSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error);
    }
    throw error;
  }
}

// URL validation helper
export function isValidUrl(url: string): boolean {
  try {
    UrlSchema.parse(url);
    return true;
  } catch {
    return false;
  }
}

// Headers validation helper
export function validateHeaders(headers: Record<string, string>): boolean {
  try {
    // Check for valid header names and values
    for (const [name, value] of Object.entries(headers)) {
      if (!name || typeof name !== 'string') return false;
      if (typeof value !== 'string') return false;
      // Basic header name validation (no spaces, control characters)
      if (!/^[a-zA-Z0-9\-_]+$/.test(name)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Test duration validation based on virtual users
export function validateTestDuration(virtualUsers: number, duration: number): boolean {
  // Limit test duration based on virtual users to prevent resource exhaustion
  const maxDurationByUsers = {
    1000: 3600,   // 1 hour for up to 1k users
    5000: 1800,   // 30 min for up to 5k users
    10000: 900,   // 15 min for up to 10k users
  };

  for (const [userLimit, timeLimit] of Object.entries(maxDurationByUsers)) {
    if (virtualUsers <= parseInt(userLimit)) {
      return duration <= timeLimit;
    }
  }

  return false;
}