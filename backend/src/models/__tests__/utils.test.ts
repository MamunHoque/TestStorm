import { DataTransformer, validateData } from '../utils';
import { ApiTestConfig, AuthConfig } from '../ApiTest';
import { LoadTestConfig, MetricPoint, TestResults } from '../LoadTest';
import { z } from 'zod';

describe('Data Model Utils', () => {
  const validApiTestConfig: ApiTestConfig = {
    id: 'api-test-1',
    name: 'Test API',
    url: 'https://api.example.com/test',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    queryParams: { limit: '10' },
    body: '{"test": true}',
    authentication: {
      type: 'bearer',
      credentials: { token: 'test-token' },
    },
    createdAt: new Date('2023-01-01T00:00:00Z'),
    updatedAt: new Date('2023-01-01T01:00:00Z'),
  };

  const validLoadTestConfig: LoadTestConfig = {
    id: 'load-test-1',
    apiConfig: validApiTestConfig,
    concurrentUsers: 10,
    duration: 60,
    rampUpTime: 10,
    createdAt: new Date('2023-01-01T00:00:00Z'),
  };

  describe('Generic Validation', () => {
    const testSchema = z.object({
      name: z.string().min(1),
      age: z.number().min(0),
    });

    it('should validate valid data', () => {
      const validData = { name: 'John', age: 30 };
      const result = validateData(testSchema, validData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
      expect(result.errors).toBeUndefined();
    });

    it('should validate invalid data', () => {
      const invalidData = { name: '', age: -1 };
      const result = validateData(testSchema, invalidData);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should handle unknown validation errors', () => {
      const mockSchema = {
        parse: jest.fn().mockImplementation(() => {
          throw new Error('Unknown error');
        }),
      } as any;

      const result = validateData(mockSchema, {});

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(['Unknown validation error']);
    });
  });

  describe('DataTransformer', () => {
    describe('API Test Config Transformation', () => {
      it('should transform API test config to storage format', () => {
        const storageData = DataTransformer.apiTestConfigToStorage(validApiTestConfig);

        expect(storageData.createdAt).toBe('2023-01-01T00:00:00.000Z');
        expect(storageData.updatedAt).toBe('2023-01-01T01:00:00.000Z');
        expect(storageData.name).toBe(validApiTestConfig.name);
        expect(storageData.url).toBe(validApiTestConfig.url);
      });

      it('should transform API test config from storage format', () => {
        const storageData = {
          ...validApiTestConfig,
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T01:00:00.000Z',
        };

        const config = DataTransformer.apiTestConfigFromStorage(storageData);

        expect(config.createdAt).toBeInstanceOf(Date);
        expect(config.updatedAt).toBeInstanceOf(Date);
        expect(config.createdAt.toISOString()).toBe('2023-01-01T00:00:00.000Z');
        expect(config.name).toBe(validApiTestConfig.name);
      });
    });

    describe('Load Test Config Transformation', () => {
      it('should transform load test config to storage format', () => {
        const storageData = DataTransformer.loadTestConfigToStorage(validLoadTestConfig);

        expect(storageData.createdAt).toBe('2023-01-01T00:00:00.000Z');
        expect(storageData.apiConfig.createdAt).toBe('2023-01-01T00:00:00.000Z');
        expect(storageData.concurrentUsers).toBe(validLoadTestConfig.concurrentUsers);
      });

      it('should transform load test config from storage format', () => {
        const storageData = {
          ...validLoadTestConfig,
          createdAt: '2023-01-01T00:00:00.000Z',
          apiConfig: {
            ...validApiTestConfig,
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T01:00:00.000Z',
          },
        };

        const config = DataTransformer.loadTestConfigFromStorage(storageData);

        expect(config.createdAt).toBeInstanceOf(Date);
        expect(config.apiConfig.createdAt).toBeInstanceOf(Date);
        expect(config.apiConfig.updatedAt).toBeInstanceOf(Date);
      });
    });

    describe('Test Results Transformation', () => {
      const validTestResults: TestResults = {
        id: 'test-results-1',
        testConfigId: 'load-test-1',
        startTime: new Date('2023-01-01T00:00:00Z'),
        endTime: new Date('2023-01-01T01:00:00Z'),
        status: 'completed',
        summary: {
          totalRequests: 1000,
          successfulRequests: 950,
          failedRequests: 50,
          averageLatency: 100,
          p95Latency: 200,
          p99Latency: 300,
          maxLatency: 500,
          requestsPerSecond: 16.67,
          errorRate: 0.05,
        },
        metrics: [],
      };

      it('should transform test results to storage format', () => {
        const storageData = DataTransformer.testResultsToStorage(validTestResults);

        expect(storageData.startTime).toBe('2023-01-01T00:00:00.000Z');
        expect(storageData.endTime).toBe('2023-01-01T01:00:00.000Z');
        expect(storageData.summary.totalRequests).toBe(1000);
      });

      it('should transform test results from storage format', () => {
        const storageData = {
          ...validTestResults,
          startTime: '2023-01-01T00:00:00.000Z',
          endTime: '2023-01-01T01:00:00.000Z',
        };

        const results = DataTransformer.testResultsFromStorage(storageData);

        expect(results.startTime).toBeInstanceOf(Date);
        expect(results.endTime).toBeInstanceOf(Date);
        expect(results.startTime.toISOString()).toBe('2023-01-01T00:00:00.000Z');
      });
    });

    describe('Authentication Sanitization', () => {
      it('should sanitize bearer token', () => {
        const auth: AuthConfig = {
          type: 'bearer',
          credentials: { token: 'secret-token' },
        };

        const sanitized = DataTransformer.sanitizeAuthConfig(auth);

        expect(sanitized!.type).toBe('bearer');
        expect(sanitized!.credentials.token).toBe('[REDACTED]');
      });

      it('should sanitize API key', () => {
        const auth: AuthConfig = {
          type: 'apikey',
          credentials: { key: 'X-API-Key', value: 'secret-key' },
        };

        const sanitized = DataTransformer.sanitizeAuthConfig(auth);

        expect(sanitized!.type).toBe('apikey');
        expect(sanitized!.credentials.key).toBe('X-API-Key');
        expect(sanitized!.credentials.value).toBe('[REDACTED]');
      });

      it('should sanitize basic auth', () => {
        const auth: AuthConfig = {
          type: 'basic',
          credentials: { username: 'user', password: 'secret-password' },
        };

        const sanitized = DataTransformer.sanitizeAuthConfig(auth);

        expect(sanitized!.type).toBe('basic');
        expect(sanitized!.credentials.username).toBe('user');
        expect(sanitized!.credentials.password).toBe('[REDACTED]');
      });

      it('should handle undefined auth config', () => {
        const sanitized = DataTransformer.sanitizeAuthConfig(undefined);

        expect(sanitized).toBeUndefined();
      });

      it('should sanitize API test config', () => {
        const sanitized = DataTransformer.sanitizeApiTestConfig(validApiTestConfig);

        expect(sanitized.name).toBe(validApiTestConfig.name);
        expect(sanitized.authentication!.credentials.token).toBe('[REDACTED]');
      });
    });

    describe('Utility Functions', () => {
      it('should generate unique IDs', () => {
        const id1 = DataTransformer.generateId('test');
        const id2 = DataTransformer.generateId('test');

        expect(id1).toMatch(/^test_\d+_[a-z0-9]+$/);
        expect(id2).toMatch(/^test_\d+_[a-z0-9]+$/);
        expect(id1).not.toBe(id2);
      });

      it('should calculate percentiles', () => {
        const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

        expect(DataTransformer.calculatePercentile(values, 50)).toBe(5);
        expect(DataTransformer.calculatePercentile(values, 90)).toBe(9);
        expect(DataTransformer.calculatePercentile(values, 100)).toBe(10);
        expect(DataTransformer.calculatePercentile([], 50)).toBe(0);
      });

      it('should calculate averages', () => {
        expect(DataTransformer.calculateAverage([1, 2, 3, 4, 5])).toBe(3);
        expect(DataTransformer.calculateAverage([10, 20, 30])).toBe(20);
        expect(DataTransformer.calculateAverage([])).toBe(0);
      });

      it('should calculate error rates', () => {
        expect(DataTransformer.calculateErrorRate(90, 100)).toBe(0.1);
        expect(DataTransformer.calculateErrorRate(100, 100)).toBe(0);
        expect(DataTransformer.calculateErrorRate(0, 100)).toBe(1);
        expect(DataTransformer.calculateErrorRate(0, 0)).toBe(0);
      });

      it('should validate URLs', () => {
        expect(DataTransformer.validateUrl('https://example.com')).toEqual({ isValid: true });
        expect(DataTransformer.validateUrl('http://example.com')).toEqual({ isValid: true });
        expect(DataTransformer.validateUrl('ftp://example.com')).toEqual({
          isValid: false,
          error: 'URL must use HTTP or HTTPS protocol',
        });
        expect(DataTransformer.validateUrl('invalid-url')).toEqual({
          isValid: false,
          error: 'Invalid URL format',
        });
      });

      it('should validate JSON', () => {
        expect(DataTransformer.validateJson('{"valid": true}')).toEqual({
          isValid: true,
          parsed: { valid: true },
        });
        expect(DataTransformer.validateJson('{"invalid": json}')).toEqual({
          isValid: false,
          error: expect.any(String),
        });
      });

      it('should deep clone objects', () => {
        const original = { a: 1, b: { c: 2 } };
        const cloned = DataTransformer.deepClone(original);

        expect(cloned).toEqual(original);
        expect(cloned).not.toBe(original);
        expect(cloned.b).not.toBe(original.b);
      });

      it('should merge objects', () => {
        const target = { a: 1, b: 2 };
        const source = { b: 3, c: 4 };
        const merged = DataTransformer.mergeObjects(target, source);

        expect(merged).toEqual({ a: 1, b: 3, c: 4 });
        expect(merged).not.toBe(target);
      });
    });
  });
});