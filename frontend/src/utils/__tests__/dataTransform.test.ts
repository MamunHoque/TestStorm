import { describe, it, expect } from 'vitest';
import {
  serializeApiTestConfig,
  deserializeApiTestConfig,
  headersToArray,
  arrayToHeaders,
  queryParamsToArray,
  arrayToQueryParams,
  formatAuthConfig,
  formatDuration,
  formatLatency,
  formatRequestRate,
  formatErrorRate,
  generateTestId,
  calculatePercentile,
  calculateTestSummary,
} from '../dataTransform';
import { ApiTestConfig, MetricPoint } from '@/types/api';

describe('Data Transform Utils', () => {
  describe('API Test Config serialization', () => {
    it('should serialize and deserialize API test config correctly', () => {
      const config: ApiTestConfig = {
        id: 'test-123',
        name: 'Test API',
        url: 'https://api.example.com/test',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        queryParams: { 'param1': 'value1' },
        body: '{"test": true}',
        authentication: {
          type: 'bearer',
          credentials: { token: 'secret' },
        },
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z'),
      };

      const serialized = serializeApiTestConfig(config);
      const deserialized = deserializeApiTestConfig(serialized);

      expect(deserialized).toEqual(config);
      expect(deserialized.createdAt).toBeInstanceOf(Date);
      expect(deserialized.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Headers transformation', () => {
    it('should convert headers object to array and back', () => {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token',
      };

      const array = headersToArray(headers);
      expect(array).toHaveLength(2);
      expect(array[0]).toEqual({ key: 'Content-Type', value: 'application/json' });

      const backToObject = arrayToHeaders(array);
      expect(backToObject).toEqual(headers);
    });

    it('should filter out empty keys and values', () => {
      const array = [
        { key: 'Valid-Header', value: 'value' },
        { key: '', value: 'invalid' },
        { key: 'Another-Header', value: '' },
      ];

      const headers = arrayToHeaders(array);
      expect(headers).toEqual({ 'Valid-Header': 'value' });
    });
  });

  describe('Query params transformation', () => {
    it('should convert query params object to array and back', () => {
      const params = {
        'param1': 'value1',
        'param2': 'value2',
      };

      const array = queryParamsToArray(params);
      expect(array).toHaveLength(2);

      const backToObject = arrayToQueryParams(array);
      expect(backToObject).toEqual(params);
    });

    it('should allow empty values but filter empty keys', () => {
      const array = [
        { key: 'param1', value: 'value1' },
        { key: 'param2', value: '' },
        { key: '', value: 'invalid' },
      ];

      const params = arrayToQueryParams(array);
      expect(params).toEqual({
        'param1': 'value1',
        'param2': '',
      });
    });
  });

  describe('Format functions', () => {
    it('should format auth config correctly', () => {
      expect(formatAuthConfig()).toBe('None');
      expect(formatAuthConfig({
        type: 'bearer',
        credentials: { token: 'secret' },
      })).toBe('Bearer Token');
      expect(formatAuthConfig({
        type: 'apikey',
        credentials: { 'X-API-Key': 'secret' },
      })).toBe('API Key (X-API-Key)');
      expect(formatAuthConfig({
        type: 'basic',
        credentials: { username: 'user', password: 'pass' },
      })).toBe('Basic Authentication');
    });

    it('should format duration correctly', () => {
      expect(formatDuration(30)).toBe('30s');
      expect(formatDuration(90)).toBe('1m 30s');
      expect(formatDuration(120)).toBe('2m');
      expect(formatDuration(3660)).toBe('1h 1m');
      expect(formatDuration(3600)).toBe('1h');
    });

    it('should format latency correctly', () => {
      expect(formatLatency(500)).toBe('500ms');
      expect(formatLatency(1500)).toBe('1.50s');
      expect(formatLatency(999)).toBe('999ms');
    });

    it('should format request rate correctly', () => {
      expect(formatRequestRate(100.5)).toBe('100.5 req/s');
      expect(formatRequestRate(1500)).toBe('1.5k req/s');
      expect(formatRequestRate(999)).toBe('999.0 req/s');
    });

    it('should format error rate correctly', () => {
      expect(formatErrorRate(0.05)).toBe('5.00%');
      expect(formatErrorRate(0.1234)).toBe('12.34%');
      expect(formatErrorRate(0)).toBe('0.00%');
    });
  });

  describe('Utility functions', () => {
    it('should generate unique test IDs', () => {
      const id1 = generateTestId();
      const id2 = generateTestId();

      expect(id1).toMatch(/^test_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^test_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('should calculate percentiles correctly', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      expect(calculatePercentile(values, 50)).toBe(5);
      expect(calculatePercentile(values, 90)).toBe(9);
      expect(calculatePercentile(values, 95)).toBe(10);
      expect(calculatePercentile([], 50)).toBe(0);
    });

    it('should calculate test summary correctly', () => {
      const metrics: MetricPoint[] = [
        {
          timestamp: Date.now(),
          requestsPerSecond: 100,
          averageLatency: 200,
          errorRate: 0.1,
          activeUsers: 50,
        },
        {
          timestamp: Date.now() + 1000,
          requestsPerSecond: 120,
          averageLatency: 180,
          errorRate: 0.05,
          activeUsers: 60,
        },
      ];

      const summary = calculateTestSummary(metrics);

      expect(summary.totalRequests).toBe(220);
      expect(summary.averageLatency).toBe(190);
      expect(summary.errorRate).toBeCloseTo(0.075, 3);
      expect(summary.requestsPerSecond).toBe(110);
    });

    it('should handle empty metrics array', () => {
      const summary = calculateTestSummary([]);

      expect(summary.totalRequests).toBe(0);
      expect(summary.averageLatency).toBe(0);
      expect(summary.errorRate).toBe(0);
    });
  });
});