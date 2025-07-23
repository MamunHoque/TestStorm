import { describe, it, expect } from 'vitest';
import {
  ValidationUtils,
  ApiTestConfig,
  LoadTestConfig,
  TestEndpointRequest,
  StartLoadTestRequest,
  AuthConfig,
  HttpMethod,
} from '../index';

describe('Frontend Validation Utils', () => {
  const validApiTestConfig: ApiTestConfig = {
    id: 'api-test-1',
    name: 'Test API',
    url: 'https://api.example.com/test',
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
});