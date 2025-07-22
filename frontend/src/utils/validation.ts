import { z } from 'zod';
import { HttpMethod, AuthType } from '@/types/api';

// HTTP Method validation
export const httpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);

// URL validation schema
export const urlSchema = z
  .string()
  .min(1, 'URL is required')
  .url('Please enter a valid URL')
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    'URL must use HTTP or HTTPS protocol'
  );

// Authentication configuration validation
export const authConfigSchema = z.object({
  type: z.enum(['bearer', 'apikey', 'basic']),
  credentials: z.record(z.string()),
});

// API Test Configuration validation schema
export const apiTestConfigSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Test name is required').max(100, 'Name too long'),
  url: urlSchema,
  method: httpMethodSchema,
  headers: z.record(z.string()).default({}),
  queryParams: z.record(z.string()).default({}),
  body: z.string().optional(),
  authentication: authConfigSchema.optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// Load Test Configuration validation schema
export const loadTestConfigSchema = z.object({
  id: z.string(),
  apiConfig: apiTestConfigSchema,
  concurrentUsers: z
    .number()
    .min(1, 'At least 1 concurrent user required')
    .max(10000, 'Maximum 10,000 concurrent users allowed'),
  duration: z
    .number()
    .min(1, 'Duration must be at least 1 second')
    .max(3600, 'Maximum duration is 1 hour'),
  rampUpTime: z
    .number()
    .min(0, 'Ramp-up time cannot be negative')
    .max(300, 'Maximum ramp-up time is 5 minutes'),
  createdAt: z.date().default(() => new Date()),
});

// Test endpoint request validation
export const testEndpointRequestSchema = z.object({
  url: urlSchema,
  method: httpMethodSchema,
  headers: z.record(z.string()).default({}),
  queryParams: z.record(z.string()).default({}),
  body: z.string().optional(),
  auth: authConfigSchema.optional(),
});

// Load test start request validation
export const startLoadTestRequestSchema = z.object({
  target: apiTestConfigSchema,
  config: z.object({
    concurrentUsers: z.number().min(1).max(10000),
    duration: z.number().min(1).max(3600),
    rampUpTime: z.number().min(0).max(300),
  }),
});

// Validation helper functions
export const validateApiTestConfig = (data: unknown) => {
  return apiTestConfigSchema.safeParse(data);
};

export const validateLoadTestConfig = (data: unknown) => {
  return loadTestConfigSchema.safeParse(data);
};

export const validateTestEndpointRequest = (data: unknown) => {
  return testEndpointRequestSchema.safeParse(data);
};

export const validateStartLoadTestRequest = (data: unknown) => {
  return startLoadTestRequestSchema.safeParse(data);
};

// Custom validation functions
export const isValidJson = (jsonString: string): boolean => {
  if (!jsonString.trim()) return true; // Empty string is valid (no body)
  
  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
};

export const validateHeaders = (headers: Record<string, string>): string[] => {
  const errors: string[] = [];
  
  Object.entries(headers).forEach(([key, value]) => {
    if (!key.trim()) {
      errors.push('Header name cannot be empty');
    }
    if (key.includes(' ')) {
      errors.push(`Header name "${key}" cannot contain spaces`);
    }
    if (!value.trim()) {
      errors.push(`Header "${key}" value cannot be empty`);
    }
  });
  
  return errors;
};

export const validateQueryParams = (params: Record<string, string>): string[] => {
  const errors: string[] = [];
  
  Object.entries(params).forEach(([key, value]) => {
    if (!key.trim()) {
      errors.push('Query parameter name cannot be empty');
    }
    // Query parameter values can be empty (valid use case)
  });
  
  return errors;
};

// Authentication validation helpers
export const validateBearerToken = (token: string): boolean => {
  return token.trim().length > 0;
};

export const validateApiKey = (key: string, value: string): boolean => {
  return key.trim().length > 0 && value.trim().length > 0;
};

export const validateBasicAuth = (username: string, password: string): boolean => {
  return username.trim().length > 0 && password.trim().length > 0;
};