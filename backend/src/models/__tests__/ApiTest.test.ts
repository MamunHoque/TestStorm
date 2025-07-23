import { ApiTest, ApiTestConfig, AuthConfig, GraphQLRequest } from '../ApiTest';
import { validateApiTestConfig, validateTestEndpointRequest, validateAuthConfig, validateGraphQLRequest } from '../utils';

describe('ApiTest Model', () => {
  const validApiTestConfig: ApiTestConfig = {
    id: 'test-1',
    name: 'Test API',
    url: 'https://api.example.com/test',
    apiType: 'rest',
    method: 'GET',
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
  
  const validGraphQLApiTestConfig: ApiTestConfig = {
    id: 'test-graphql-1',
    name: 'GraphQL API Test',
    url: 'https://api.example.com/graphql',
    apiType: 'graphql',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    queryParams: {},
    graphql: {
      operationType: 'query',
      operationName: 'GetUser',
      query: `query GetUser($id: ID!) {
        user(id: $id) {
          id
          name
          email
        }
      }`,
      variables: '{"id": "123"}'
    },
    authentication: {
      type: 'bearer',
      credentials: { token: 'test-token' },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('ApiTest Class', () => {
    it('should create an ApiTest instance with valid config', () => {
      const apiTest = new ApiTest(validApiTestConfig);
      const config = apiTest.getConfig();

      expect(config.name).toBe(validApiTestConfig.name);
      expect(config.url).toBe(validApiTestConfig.url);
      expect(config.method).toBe(validApiTestConfig.method);
    });

    it('should generate ID if not provided', () => {
      const configWithoutId = { ...validApiTestConfig };
      delete configWithoutId.id;

      const apiTest = new ApiTest(configWithoutId);
      const config = apiTest.getConfig();

      expect(config.id).toBeDefined();
      expect(config.id).toMatch(/^api_test_\d+_[a-z0-9]+$/);
    });

    it('should update configuration', () => {
      const apiTest = new ApiTest(validApiTestConfig);
      const newName = 'Updated Test Name';

      apiTest.updateConfig({ name: newName });
      const config = apiTest.getConfig();

      expect(config.name).toBe(newName);
      expect(config.updatedAt.getTime()).toBeGreaterThan(validApiTestConfig.updatedAt.getTime());
    });

    it('should validate valid configuration', () => {
      const apiTest = new ApiTest(validApiTestConfig);
      const validation = apiTest.validate();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should validate invalid URL', () => {
      const invalidConfig = { ...validApiTestConfig, url: 'invalid-url' };
      const apiTest = new ApiTest(invalidConfig);
      const validation = apiTest.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('url: Invalid URL format');
    });

    it('should validate empty name', () => {
      const invalidConfig = { ...validApiTestConfig, name: '' };
      const apiTest = new ApiTest(invalidConfig);
      const validation = apiTest.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('Test name is required'))).toBe(true);
    });

    it('should validate invalid HTTP method', () => {
      const invalidConfig = { ...validApiTestConfig, method: 'INVALID' as any };
      const apiTest = new ApiTest(invalidConfig);
      const validation = apiTest.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('method'))).toBe(true);
    });

    it('should validate header names with spaces', () => {
      const invalidConfig = {
        ...validApiTestConfig,
        headers: { 'Invalid Header': 'value' },
      };
      const apiTest = new ApiTest(invalidConfig);
      const validation = apiTest.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Header name "Invalid Header" cannot contain spaces');
    });

    it('should validate empty header names', () => {
      const invalidConfig = {
        ...validApiTestConfig,
        headers: { '': 'value' },
      };
      const apiTest = new ApiTest(invalidConfig);
      const validation = apiTest.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Header name cannot be empty');
    });

    it('should validate bearer authentication', () => {
      const invalidAuth: AuthConfig = {
        type: 'bearer',
        credentials: {},
      };
      const invalidConfig = { ...validApiTestConfig, authentication: invalidAuth };
      const apiTest = new ApiTest(invalidConfig);
      const validation = apiTest.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Bearer token is required');
    });

    it('should validate API key authentication', () => {
      const invalidAuth: AuthConfig = {
        type: 'apikey',
        credentials: { key: 'X-API-Key' },
      };
      const invalidConfig = { ...validApiTestConfig, authentication: invalidAuth };
      const apiTest = new ApiTest(invalidConfig);
      const validation = apiTest.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('API key name and value are required');
    });

    it('should validate basic authentication', () => {
      const invalidAuth: AuthConfig = {
        type: 'basic',
        credentials: { username: 'user' },
      };
      const invalidConfig = { ...validApiTestConfig, authentication: invalidAuth };
      const apiTest = new ApiTest(invalidConfig);
      const validation = apiTest.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Username and password are required for basic auth');
    });

    it('should validate invalid JSON body', () => {
      const invalidConfig = { ...validApiTestConfig, body: '{"invalid": json}' };
      const apiTest = new ApiTest(invalidConfig);
      const validation = apiTest.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Request body must be valid JSON');
    });
    
    it('should validate GraphQL API test config', () => {
      const apiTest = new ApiTest(validGraphQLApiTestConfig);
      const validation = apiTest.validate();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should validate missing GraphQL query', () => {
      const invalidConfig = { 
        ...validGraphQLApiTestConfig, 
        graphql: { ...validGraphQLApiTestConfig.graphql!, query: '' } 
      };
      const apiTest = new ApiTest(invalidConfig);
      const validation = apiTest.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('GraphQL query is required');
    });

    it('should validate invalid GraphQL query syntax', () => {
      const invalidConfig = { 
        ...validGraphQLApiTestConfig, 
        graphql: { ...validGraphQLApiTestConfig.graphql!, query: 'query { unclosed' } 
      };
      const apiTest = new ApiTest(invalidConfig);
      const validation = apiTest.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Unbalanced braces in GraphQL query');
    });

    it('should validate invalid GraphQL variables', () => {
      const invalidConfig = { 
        ...validGraphQLApiTestConfig, 
        graphql: { ...validGraphQLApiTestConfig.graphql!, variables: '{"invalid": json}' } 
      };
      const apiTest = new ApiTest(invalidConfig);
      const validation = apiTest.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('GraphQL variables must be valid JSON');
    });

    it('should serialize to JSON', () => {
      const apiTest = new ApiTest(validApiTestConfig);
      const json = apiTest.toJSON();
      const parsed = JSON.parse(json);

      expect(parsed.name).toBe(validApiTestConfig.name);
      expect(parsed.url).toBe(validApiTestConfig.url);
      expect(typeof parsed.createdAt).toBe('string');
      expect(typeof parsed.updatedAt).toBe('string');
    });

    it('should deserialize from JSON', () => {
      const apiTest = new ApiTest(validApiTestConfig);
      const json = apiTest.toJSON();
      const deserialized = ApiTest.fromJSON(json);
      const config = deserialized.getConfig();

      expect(config.name).toBe(validApiTestConfig.name);
      expect(config.url).toBe(validApiTestConfig.url);
      expect(config.createdAt).toBeInstanceOf(Date);
      expect(config.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Validation Functions', () => {
    it('should validate valid ApiTestConfig', () => {
      const result = validateApiTestConfig(validApiTestConfig);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validApiTestConfig);
      expect(result.errors).toBeUndefined();
    });
    
    it('should validate valid GraphQL ApiTestConfig', () => {
      const result = validateApiTestConfig(validGraphQLApiTestConfig);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validGraphQLApiTestConfig);
      expect(result.errors).toBeUndefined();
    });

    it('should validate invalid ApiTestConfig', () => {
      const invalidConfig = { ...validApiTestConfig, url: 'invalid-url' };
      const result = validateApiTestConfig(invalidConfig);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toBeDefined();
      expect(result.errors!.some(error => error.includes('Invalid URL format'))).toBe(true);
    });

    it('should validate TestEndpointRequest', () => {
      const request = {
        url: 'https://api.example.com/test',
        apiType: 'rest' as const,
        method: 'POST' as const,
        headers: { 'Content-Type': 'application/json' },
        queryParams: { limit: '10' },
        body: '{"test": true}',
        auth: {
          type: 'bearer' as const,
          credentials: { token: 'test-token' },
        },
      };

      const result = validateTestEndpointRequest(request);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(request);
    });

    it('should validate AuthConfig', () => {
      const authConfig: AuthConfig = {
        type: 'bearer',
        credentials: { token: 'test-token' },
      };

      const result = validateAuthConfig(authConfig);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(authConfig);
    });
    
    it('should validate GraphQLRequest', () => {
      const graphqlRequest: GraphQLRequest = {
        operationType: 'query',
        operationName: 'GetUser',
        query: `query GetUser($id: ID!) {
          user(id: $id) {
            id
            name
            email
          }
        }`,
        variables: { id: '123' },
      };

      const result = validateGraphQLRequest(graphqlRequest);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(graphqlRequest);
    });

    it('should validate invalid GraphQLRequest', () => {
      const invalidRequest = {
        operationType: 'invalid',
        query: '',
      };

      const result = validateGraphQLRequest(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should validate invalid AuthConfig', () => {
      const invalidAuth = {
        type: 'invalid-type',
        credentials: { token: 'test-token' },
      };

      const result = validateAuthConfig(invalidAuth);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });
});