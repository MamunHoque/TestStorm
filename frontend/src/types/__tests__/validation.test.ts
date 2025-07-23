import { describe, it, expect } from 'vitest';
import {
  ValidationUtils,
  type ApiTestConfig,
  type LoadTestConfig,
  type TestEndpointRequest,
  type StartLoadTestRequest,
  type AuthConfig,
  type HttpMethod,
  type GraphQLRequest,
} from '../index';
import { GraphQLValidationUtils } from '../graphql';

describe('Frontend Validation Utils', () => {
  const validApiTestConfig: ApiTestConfig = {
    id: 'api-test-1',
    name: 'Test API',
    url: 'https://api.example.com/test',
    apiType: 'rest',
    method: 'GET' as HttpMethod,
    headers: { 'Content-Type': 'application/json' },
    queryParams: { limit: '10' },
    body: '{"test": true}',
    authentication: {
      type: 'bearer',
      credentials: { token: 'test-token' },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const validLoadTestConfig: LoadTestConfig = {
    id: 'load-test-1',
    apiConfig: validApiTestConfig,
    concurrentUsers: 10,
    duration: 60,
    rampUpTime: 10,
    createdAt: new Date(),
  };

  describe('ValidationUtils', () => {
    describe('validateApiTestConfig', () => {
      it('should validate valid API test config', () => {
        const result = ValidationUtils.validateApiTestConfig(validApiTestConfig);

        expect(result.success).toBe(true);
        expect(result.data).toEqual(validApiTestConfig);
        expect(result.errors).toBeUndefined();
      });

      it('should validate invalid API test config', () => {
        const invalidConfig = { ...validApiTestConfig, url: 'invalid-url' };
        const result = ValidationUtils.validateApiTestConfig(invalidConfig);

        expect(result.success).toBe(false);
        expect(result.data).toBeUndefined();
        expect(result.errors).toBeDefined();
        expect(result.errors!.some(error => error.includes('Invalid URL format'))).toBe(true);
      });

      it('should validate empty name', () => {
        const invalidConfig = { ...validApiTestConfig, name: '' };
        const result = ValidationUtils.validateApiTestConfig(invalidConfig);

        expect(result.success).toBe(false);
        expect(result.errors!.some(error => error.includes('Test name is required'))).toBe(true);
      });

      it('should validate long name', () => {
        const invalidConfig = { ...validApiTestConfig, name: 'a'.repeat(101) };
        const result = ValidationUtils.validateApiTestConfig(invalidConfig);

        expect(result.success).toBe(false);
        expect(result.errors!.some(error => error.includes('Test name must be less than 100 characters'))).toBe(true);
      });
    });

    describe('validateTestEndpointRequest', () => {
      it('should validate valid test endpoint request', () => {
        const request: TestEndpointRequest = {
          url: 'https://api.example.com/test',
          apiType: 'rest',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          queryParams: { limit: '10' },
          body: '{"test": true}',
          auth: {
            type: 'bearer',
            credentials: { token: 'test-token' },
          },
        };

        const result = ValidationUtils.validateTestEndpointRequest(request);

        expect(result.success).toBe(true);
        expect(result.data).toEqual(request);
      });

      it('should validate invalid test endpoint request', () => {
        const invalidRequest = {
          url: 'invalid-url',
          method: 'POST',
          headers: {},
          queryParams: {},
        };

        const result = ValidationUtils.validateTestEndpointRequest(invalidRequest);

        expect(result.success).toBe(false);
        expect(result.errors!.some(error => error.includes('Invalid URL format'))).toBe(true);
      });
    });

    describe('validateLoadTestConfig', () => {
      it('should validate valid load test config', () => {
        const result = ValidationUtils.validateLoadTestConfig(validLoadTestConfig);

        expect(result.success).toBe(true);
        expect(result.data).toEqual(validLoadTestConfig);
      });

      it('should validate invalid concurrent users', () => {
        const invalidConfig = { ...validLoadTestConfig, concurrentUsers: 0 };
        const result = ValidationUtils.validateLoadTestConfig(invalidConfig);

        expect(result.success).toBe(false);
        expect(result.errors!.some(error => error.includes('At least 1 concurrent user is required'))).toBe(true);
      });

      it('should validate maximum concurrent users', () => {
        const invalidConfig = { ...validLoadTestConfig, concurrentUsers: 15000 };
        const result = ValidationUtils.validateLoadTestConfig(invalidConfig);

        expect(result.success).toBe(false);
        expect(result.errors!.some(error => error.includes('Maximum 10,000 concurrent users allowed'))).toBe(true);
      });

      it('should validate ramp-up time vs duration', () => {
        const invalidConfig = { ...validLoadTestConfig, rampUpTime: 70, duration: 60 };
        const result = ValidationUtils.validateLoadTestConfig(invalidConfig);

        expect(result.success).toBe(false);
        expect(result.errors!.some(error => error.includes('Ramp-up time must be less than test duration'))).toBe(true);
      });
    });

    describe('validateStartLoadTestRequest', () => {
      it('should validate valid start load test request', () => {
        const request: StartLoadTestRequest = {
          target: validApiTestConfig,
          config: {
            concurrentUsers: 10,
            duration: 60,
            rampUpTime: 10,
          },
        };

        const result = ValidationUtils.validateStartLoadTestRequest(request);

        expect(result.success).toBe(true);
        expect(result.data).toEqual(request);
      });

      it('should validate invalid start load test request', () => {
        const request = {
          target: validApiTestConfig,
          config: {
            concurrentUsers: 10,
            duration: 60,
            rampUpTime: 70, // Invalid: ramp-up time >= duration
          },
        };

        const result = ValidationUtils.validateStartLoadTestRequest(request);

        expect(result.success).toBe(false);
        expect(result.errors!.some(error => error.includes('Ramp-up time must be less than test duration'))).toBe(true);
      });
    });

    describe('validateUrl', () => {
      it('should validate valid URLs', () => {
        expect(ValidationUtils.validateUrl('https://example.com')).toEqual({ isValid: true });
        expect(ValidationUtils.validateUrl('http://example.com')).toEqual({ isValid: true });
        expect(ValidationUtils.validateUrl('https://api.example.com/v1/test?param=value')).toEqual({ isValid: true });
      });

      it('should validate invalid URLs', () => {
        expect(ValidationUtils.validateUrl('ftp://example.com')).toEqual({
          isValid: false,
          error: 'URL must use HTTP or HTTPS protocol',
        });
        expect(ValidationUtils.validateUrl('invalid-url')).toEqual({
          isValid: false,
          error: 'Invalid URL format',
        });
        expect(ValidationUtils.validateUrl('')).toEqual({
          isValid: false,
          error: 'Invalid URL format',
        });
      });
    });

    describe('validateJson', () => {
      it('should validate valid JSON', () => {
        const validJson = '{"name": "test", "value": 123}';
        const result = ValidationUtils.validateJson(validJson);

        expect(result.isValid).toBe(true);
        expect(result.parsed).toEqual({ name: 'test', value: 123 });
        expect(result.error).toBeUndefined();
      });

      it('should validate invalid JSON', () => {
        const invalidJson = '{"name": "test", "value": }';
        const result = ValidationUtils.validateJson(invalidJson);

        expect(result.isValid).toBe(false);
        expect(result.parsed).toBeUndefined();
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      });

      it('should handle empty string', () => {
        const result = ValidationUtils.validateJson('');

        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    describe('validateGraphQLRequest', () => {
      it('should validate valid GraphQL request', () => {
        const request: Partial<GraphQLRequest> = {
          operationType: 'query',
          query: `query GetUser {
            user(id: "123") {
              id
              name
              email
            }
          }`,
          variables: JSON.stringify({ id: '123' }),
        };

        const result = ValidationUtils.validateGraphQLRequest(request);

        expect(result.isValid).toBe(true);
        expect(result.errors).toBeUndefined();
      });

      it('should validate invalid GraphQL query', () => {
        const request: Partial<GraphQLRequest> = {
          operationType: 'query',
          query: '', // Empty query
        };

        const result = ValidationUtils.validateGraphQLRequest(request);

        expect(result.isValid).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors!.includes('GraphQL query is required')).toBe(true);
      });

      it('should validate invalid GraphQL variables', () => {
        const request: Partial<GraphQLRequest> = {
          operationType: 'query',
          query: `query GetUser { user(id: "123") { id name } }`,
          variables: '{ invalid json }',
        };

        const result = ValidationUtils.validateGraphQLRequest(request);

        expect(result.isValid).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors!.includes('GraphQL variables must be valid JSON')).toBe(true);
      });
    });

    describe('sanitizeAuthConfig', () => {
      it('should sanitize bearer token', () => {
        const auth: AuthConfig = {
          type: 'bearer',
          credentials: { token: 'secret-token' },
        };

        const sanitized = ValidationUtils.sanitizeAuthConfig(auth);

        expect(sanitized!.type).toBe('bearer');
        expect(sanitized!.credentials.token).toBe('[REDACTED]');
      });

      it('should sanitize API key', () => {
        const auth: AuthConfig = {
          type: 'apikey',
          credentials: { key: 'X-API-Key', value: 'secret-key' },
        };

        const sanitized = ValidationUtils.sanitizeAuthConfig(auth);

        expect(sanitized!.type).toBe('apikey');
        expect(sanitized!.credentials.key).toBe('X-API-Key');
        expect(sanitized!.credentials.value).toBe('[REDACTED]');
      });

      it('should sanitize basic auth', () => {
        const auth: AuthConfig = {
          type: 'basic',
          credentials: { username: 'user', password: 'secret-password' },
        };

        const sanitized = ValidationUtils.sanitizeAuthConfig(auth);

        expect(sanitized!.type).toBe('basic');
        expect(sanitized!.credentials.username).toBe('user');
        expect(sanitized!.credentials.password).toBe('[REDACTED]');
      });

      it('should handle undefined auth config', () => {
        const sanitized = ValidationUtils.sanitizeAuthConfig(undefined);

        expect(sanitized).toBeUndefined();
      });
    });
  });

  describe('Schema Validation Edge Cases', () => {
    it('should handle unknown validation errors', () => {
      // Test with completely invalid data structure
      const result = ValidationUtils.validateApiTestConfig(null);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should validate HTTP methods', () => {
      const validMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      
      validMethods.forEach(method => {
        const config = { ...validApiTestConfig, method };
        const result = ValidationUtils.validateApiTestConfig(config);
        expect(result.success).toBe(true);
      });

      const invalidConfig = { ...validApiTestConfig, method: 'INVALID' as any };
      const result = ValidationUtils.validateApiTestConfig(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should validate authentication types', () => {
      const validAuthTypes = ['bearer', 'apikey', 'basic'];
      
      validAuthTypes.forEach(type => {
        const auth: AuthConfig = {
          type: type as any,
          credentials: { token: 'test' },
        };
        const config = { ...validApiTestConfig, authentication: auth };
        const result = ValidationUtils.validateApiTestConfig(config);
        expect(result.success).toBe(true);
      });

      const invalidAuth = {
        type: 'invalid-type',
        credentials: { token: 'test' },
      };
      const config = { ...validApiTestConfig, authentication: invalidAuth as any };
      const result = ValidationUtils.validateApiTestConfig(config);
      expect(result.success).toBe(false);
    });
  });

  describe('WebSocket Event Validation', () => {
    it('should validate WebSocket join test event', () => {
      const event = { testId: 'test-123' };
      const result = ValidationUtils.validateWebSocketJoinTestEvent(event);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(event);
    });

    it('should validate WebSocket test metrics event', () => {
      const event = {
        testId: 'test-123',
        timestamp: Date.now(),
        requestsPerSecond: 100,
        averageLatency: 50,
        errorRate: 0.01,
        activeUsers: 10,
      };
      const result = ValidationUtils.validateWebSocketTestMetricsEvent(event);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(event);
    });

    it('should validate invalid WebSocket test metrics event', () => {
      const event = {
        testId: 'test-123',
        timestamp: -1, // Invalid: negative timestamp
        requestsPerSecond: 100,
        averageLatency: 50,
        errorRate: 0.01,
        activeUsers: 10,
      };
      const result = ValidationUtils.validateWebSocketTestMetricsEvent(event);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('History and Export Validation', () => {
    it('should validate test history item', () => {
      const historyItem = {
        id: 'test-123',
        name: 'Test API',
        url: 'https://api.example.com',
        method: 'GET' as HttpMethod,
        status: 'completed' as const,
        createdAt: new Date(),
        duration: 60,
        totalRequests: 1000,
        errorRate: 0.01,
      };
      const result = ValidationUtils.validateTestHistoryItem(historyItem);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(historyItem);
    });

    it('should validate export config', () => {
      const exportConfig = {
        format: 'csv' as const,
        includeMetrics: true,
        includeConfig: false,
        dateRange: {
          start: new Date('2023-01-01'),
          end: new Date('2023-12-31'),
        },
      };
      const result = ValidationUtils.validateExportConfig(exportConfig);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(exportConfig);
    });

    it('should validate test history response', () => {
      const response = {
        items: [
          {
            id: 'test-123',
            name: 'Test API',
            url: 'https://api.example.com',
            method: 'GET' as HttpMethod,
            status: 'completed' as const,
            createdAt: new Date(),
            duration: 60,
            totalRequests: 1000,
            errorRate: 0.01,
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };
      const result = ValidationUtils.validateTestHistoryResponse(response);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(response);
    });
  });
});

describe('GraphQL Validation Utils', () => {
  describe('validateGraphQLQuery', () => {
    it('should validate valid GraphQL queries', () => {
      const validQueries = [
        `query GetUser { user(id: "123") { id name email } }`,
        `{ user(id: "123") { id name email } }`, // Shorthand syntax
        `mutation CreateUser($name: String!, $email: String!) { 
          createUser(name: $name, email: $email) { id name email } 
        }`,
      ];

      validQueries.forEach(query => {
        const result = GraphQLValidationUtils.validateGraphQLQuery(query);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should validate invalid GraphQL queries', () => {
      const invalidQueries = [
        '', // Empty query
        'not a graphql query',
        '{ unclosed query',
        'query { extra }}}', // Unbalanced braces
      ];

      invalidQueries.forEach(query => {
        const result = GraphQLValidationUtils.validateGraphQLQuery(query);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('parseGraphQLVariables', () => {
    it('should parse valid GraphQL variables', () => {
      const validVariables = [
        '{"id": "123"}',
        '{"user": {"name": "John", "age": 30}}',
        '{}', // Empty object
        '', // Empty string (defaults to empty object)
      ];

      validVariables.forEach(vars => {
        const result = GraphQLValidationUtils.parseGraphQLVariables(vars);
        expect(result.isValid).toBe(true);
        expect(result.variables).toBeDefined();
        expect(result.error).toBeUndefined();
      });
    });

    it('should validate invalid GraphQL variables', () => {
      const invalidVariables = [
        '{"invalid": json}',
        'not json',
        '[]', // Array instead of object
        'null', // Null instead of object
      ];

      invalidVariables.forEach(vars => {
        const result = GraphQLValidationUtils.parseGraphQLVariables(vars);
        if (vars === '[]' || vars === 'null') {
          expect(result.isValid).toBe(false);
          expect(result.error).toBe('GraphQL variables must be a JSON object');
        } else {
          expect(result.isValid).toBe(false);
          expect(result.error).toBeDefined();
        }
      });
    });
  });

  describe('detectOperationType', () => {
    it('should detect query operation type', () => {
      const queries = [
        'query GetUser { user { id } }',
        '{ user { id } }', // Shorthand syntax
        '  query   GetUser   {   user   {   id   }   }  ', // With extra spaces
      ];

      queries.forEach(query => {
        expect(GraphQLValidationUtils.detectOperationType(query)).toBe('query');
      });
    });

    it('should detect mutation operation type', () => {
      const mutations = [
        'mutation CreateUser { createUser(name: "John") { id } }',
        '  mutation   CreateUser   {   createUser(name: "John")   {   id   }   }  ', // With extra spaces
      ];

      mutations.forEach(query => {
        expect(GraphQLValidationUtils.detectOperationType(query)).toBe('mutation');
      });
    });

    it('should detect subscription operation type', () => {
      const subscriptions = [
        'subscription UserUpdates { userUpdated { id } }',
      ];

      subscriptions.forEach(query => {
        expect(GraphQLValidationUtils.detectOperationType(query)).toBe('subscription');
      });
    });
  });

  describe('extractOperationName', () => {
    it('should extract operation name from query', () => {
      expect(GraphQLValidationUtils.extractOperationName('query GetUser { user { id } }')).toBe('GetUser');
      expect(GraphQLValidationUtils.extractOperationName('mutation CreateUser { createUser { id } }')).toBe('CreateUser');
      expect(GraphQLValidationUtils.extractOperationName('subscription UserUpdates { userUpdated { id } }')).toBe('UserUpdates');
    });

    it('should return undefined for queries without operation name', () => {
      expect(GraphQLValidationUtils.extractOperationName('query { user { id } }')).toBeUndefined();
      expect(GraphQLValidationUtils.extractOperationName('{ user { id } }')).toBeUndefined();
    });
  });
});