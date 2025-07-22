import { describe, it, expect } from 'vitest';
import {
  validateApiTestConfig,
  validateLoadTestConfig,
  validateTestEndpointRequest,
  isValidJson,
  validateHeaders,
  validateQueryParams,
  validateBearerToken,
  validateApiKey,
  validateBasicAuth,
} from '../validation';

describe('Validation Utils', () => {
  describe('validateApiTestConfig', () => {
    it('should validate a correct API test config', () => {
      const validConfig = {
        name: 'Test API',
        url: 'https://api.example.com/test',
        method: 'GET',
        headers: {},
        queryParams: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = validateApiTestConfig(validConfig);
      expect(result.success).toBe(true);
    });

    it('should reject invalid URL', () => {
      const invalidConfig = {
        name: 'Test API',
        url: 'not-a-url',
        method: 'GET',
        headers: {},
        queryParams: {},
      };

      const result = validateApiTestConfig(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
      const invalidConfig = {
        name: '',
        url: 'https://api.example.com/test',
        method: 'GET',
        headers: {},
        queryParams: {},
      };

      const result = validateApiTestConfig(invalidConfig);
      expect(result.success).toBe(false);
    });
  });

  describe('validateLoadTestConfig', () => {
    it('should validate a correct load test config', () => {
      const validConfig = {
        id: 'test-123',
        apiConfig: {
          name: 'Test API',
          url: 'https://api.example.com/test',
          method: 'GET',
          headers: {},
          queryParams: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        concurrentUsers: 100,
        duration: 60,
        rampUpTime: 10,
        createdAt: new Date(),
      };

      const result = validateLoadTestConfig(validConfig);
      expect(result.success).toBe(true);
    });

    it('should reject invalid concurrent users', () => {
      const invalidConfig = {
        id: 'test-123',
        apiConfig: {
          name: 'Test API',
          url: 'https://api.example.com/test',
          method: 'GET',
          headers: {},
          queryParams: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        concurrentUsers: 0,
        duration: 60,
        rampUpTime: 10,
        createdAt: new Date(),
      };

      const result = validateLoadTestConfig(invalidConfig);
      expect(result.success).toBe(false);
    });
  });

  describe('isValidJson', () => {
    it('should return true for valid JSON', () => {
      expect(isValidJson('{"key": "value"}')).toBe(true);
      expect(isValidJson('[]')).toBe(true);
      expect(isValidJson('null')).toBe(true);
    });

    it('should return true for empty string', () => {
      expect(isValidJson('')).toBe(true);
      expect(isValidJson('   ')).toBe(true);
    });

    it('should return false for invalid JSON', () => {
      expect(isValidJson('{"key": value}')).toBe(false);
      expect(isValidJson('invalid')).toBe(false);
    });
  });

  describe('validateHeaders', () => {
    it('should return no errors for valid headers', () => {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token',
      };

      const errors = validateHeaders(headers);
      expect(errors).toHaveLength(0);
    });

    it('should return errors for invalid headers', () => {
      const headers = {
        '': 'value',
        'Invalid Header': 'value',
        'Valid-Header': '',
      };

      const errors = validateHeaders(headers);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateQueryParams', () => {
    it('should return no errors for valid query params', () => {
      const params = {
        'param1': 'value1',
        'param2': 'value2',
      };

      const errors = validateQueryParams(params);
      expect(errors).toHaveLength(0);
    });

    it('should allow empty values', () => {
      const params = {
        'param1': '',
        'param2': 'value2',
      };

      const errors = validateQueryParams(params);
      expect(errors).toHaveLength(0);
    });

    it('should return errors for empty keys', () => {
      const params = {
        '': 'value',
        'valid': 'value',
      };

      const errors = validateQueryParams(params);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Authentication validation', () => {
    it('should validate bearer token', () => {
      expect(validateBearerToken('valid-token')).toBe(true);
      expect(validateBearerToken('')).toBe(false);
      expect(validateBearerToken('   ')).toBe(false);
    });

    it('should validate API key', () => {
      expect(validateApiKey('X-API-Key', 'secret')).toBe(true);
      expect(validateApiKey('', 'secret')).toBe(false);
      expect(validateApiKey('X-API-Key', '')).toBe(false);
    });

    it('should validate basic auth', () => {
      expect(validateBasicAuth('user', 'pass')).toBe(true);
      expect(validateBasicAuth('', 'pass')).toBe(false);
      expect(validateBasicAuth('user', '')).toBe(false);
    });
  });
});