import { z } from 'zod';

// HTTP Methods supported by the application
export const HttpMethodSchema = z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);
export type HttpMethod = z.infer<typeof HttpMethodSchema>;

// API Types
export const ApiTypeSchema = z.enum(['rest', 'graphql']);
export type ApiType = z.infer<typeof ApiTypeSchema>;

// GraphQL operation types
export const GraphQLOperationTypeSchema = z.enum(['query', 'mutation', 'subscription']);
export type GraphQLOperationType = z.infer<typeof GraphQLOperationTypeSchema>;

// Authentication types
export const AuthTypeSchema = z.enum(['bearer', 'apikey', 'basic']);
export type AuthType = z.infer<typeof AuthTypeSchema>;

// Authentication configuration schema and interface
export const AuthConfigSchema = z.object({
  type: AuthTypeSchema,
  credentials: z.record(z.string(), z.string()),
});
export interface AuthConfig extends z.infer<typeof AuthConfigSchema> {}

// GraphQL request schema and interface
export const GraphQLRequestSchema = z.object({
  operationType: GraphQLOperationTypeSchema,
  operationName: z.string().optional(),
  query: z.string().min(1, 'GraphQL query is required'),
  variables: z.record(z.string(), z.any()).optional(),
});
export interface GraphQLRequest extends z.infer<typeof GraphQLRequestSchema> {}

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

// API Test class for business logic
export class ApiTest {
  private config: ApiTestConfig;

  constructor(config: ApiTestConfig) {
    this.config = {
      ...config,
      id: config.id || this.generateId(),
      createdAt: config.createdAt || new Date(),
      updatedAt: new Date(),
    };
  }

  // Generate unique ID for the test
  private generateId(): string {
    return `api_test_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  // Get test configuration
  getConfig(): ApiTestConfig {
    return { ...this.config };
  }

  // Update test configuration
  updateConfig(updates: Partial<ApiTestConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
      updatedAt: new Date(),
    };
  }

  // Validate the test configuration using Zod
  validate(): { isValid: boolean; errors: string[] } {
    try {
      ApiTestConfigSchema.parse(this.config);
      
      // Additional custom validations
      const errors: string[] = [];

      // Validate headers don't have empty keys or spaces in keys
      Object.keys(this.config.headers).forEach(key => {
        if (!key.trim()) {
          errors.push('Header name cannot be empty');
        }
        if (key.includes(' ')) {
          errors.push(`Header name "${key}" cannot contain spaces`);
        }
      });

      // Validate authentication credentials based on type
      if (this.config.authentication) {
        const auth = this.config.authentication;
        switch (auth.type) {
          case 'bearer':
            if (!auth.credentials.token) {
              errors.push('Bearer token is required');
            }
            break;
          case 'apikey':
            if (!auth.credentials.key || !auth.credentials.value) {
              errors.push('API key name and value are required');
            }
            break;
          case 'basic':
            if (!auth.credentials.username || !auth.credentials.password) {
              errors.push('Username and password are required for basic auth');
            }
            break;
        }
      }

      // Validate based on API type
      if (this.config.apiType === 'rest') {
        // Validate JSON body if present for REST APIs
        if (this.config.body) {
          try {
            JSON.parse(this.config.body);
          } catch {
            errors.push('Request body must be valid JSON');
          }
        }
      } else if (this.config.apiType === 'graphql') {
        // Validate GraphQL configuration
        if (!this.config.graphql) {
          errors.push('GraphQL configuration is required for GraphQL API type');
        } else {
          // Validate GraphQL query
          if (!this.config.graphql.query || !this.config.graphql.query.trim()) {
            errors.push('GraphQL query is required');
          } else {
            // Basic GraphQL query validation
            const query = this.config.graphql.query;
            
            // Check for balanced braces
            let braceCount = 0;
            for (const char of query) {
              if (char === '{') braceCount++;
              if (char === '}') braceCount--;
              if (braceCount < 0) {
                errors.push('Unbalanced braces in GraphQL query');
                break;
              }
            }
            
            if (braceCount !== 0) {
              errors.push('Unbalanced braces in GraphQL query');
            }
          }
          
          // Validate GraphQL variables if present
          if (this.config.graphql.variables) {
            try {
              JSON.parse(this.config.graphql.variables);
            } catch {
              errors.push('GraphQL variables must be valid JSON');
            }
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
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
      ...this.config,
      createdAt: this.config.createdAt.toISOString(),
      updatedAt: this.config.updatedAt.toISOString(),
    });
  }

  // Create from JSON
  static fromJSON(json: string): ApiTest {
    const data = JSON.parse(json);
    return new ApiTest({
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    });
  }
}