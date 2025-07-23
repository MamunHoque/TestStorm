import { LoadTest, LoadTestConfig, MetricPoint, TestResults } from '../LoadTest';
import { ApiTestConfig } from '../ApiTest';
import { validateLoadTestConfig, validateStartLoadTestRequest, validateMetricPoint } from '../utils';

describe('LoadTest Model', () => {
  const validApiTestConfig: ApiTestConfig = {
    id: 'api-test-1',
    name: 'Test API',
    url: 'https://api.example.com/test',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    queryParams: { limit: '10' },
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

  describe('LoadTest Class', () => {
    it('should create a LoadTest instance with valid config', () => {
      const loadTest = new LoadTest(validLoadTestConfig);
      const config = loadTest.getConfig();

      expect(config.concurrentUsers).toBe(validLoadTestConfig.concurrentUsers);
      expect(config.duration).toBe(validLoadTestConfig.duration);
      expect(config.rampUpTime).toBe(validLoadTestConfig.rampUpTime);
    });

    it('should generate ID if not provided', () => {
      const configWithoutId = { ...validLoadTestConfig };
      const { id, ...configWithoutIdTyped } = configWithoutId;

      const loadTest = new LoadTest(configWithoutIdTyped as LoadTestConfig);
      const config = loadTest.getConfig();

      expect(config.id).toBeDefined();
      expect(config.id).toMatch(/^load_test_\d+_[a-z0-9]+$/);
    });

    it('should initialize with running status', () => {
      const loadTest = new LoadTest(validLoadTestConfig);

      expect(loadTest.getStatus()).toBe('running');
    });

    it('should initialize test results', () => {
      const loadTest = new LoadTest(validLoadTestConfig);
      loadTest.initializeResults();
      const results = loadTest.getResults();

      expect(results).toBeDefined();
      expect(results!.status).toBe('running');
      expect(results!.testConfigId).toBe(validLoadTestConfig.id);
      expect(results!.metrics).toHaveLength(0);
    });

    it('should add metric points', () => {
      const loadTest = new LoadTest(validLoadTestConfig);
      const metric: MetricPoint = {
        timestamp: Date.now(),
        requestsPerSecond: 100,
        averageLatency: 50,
        errorRate: 0.01,
        activeUsers: 10,
      };

      loadTest.addMetricPoint(metric);
      const results = loadTest.getResults();

      expect(results!.metrics).toHaveLength(1);
      expect(results!.metrics[0]).toEqual(metric);
    });

    it('should complete test and calculate summary', () => {
      const loadTest = new LoadTest(validLoadTestConfig);
      loadTest.initializeResults();

      const metrics: MetricPoint[] = [
        {
          timestamp: Date.now(),
          requestsPerSecond: 100,
          averageLatency: 50,
          errorRate: 0.01,
          activeUsers: 10,
        },
        {
          timestamp: Date.now() + 1000,
          requestsPerSecond: 120,
          averageLatency: 60,
          errorRate: 0.02,
          activeUsers: 10,
        },
      ];

      metrics.forEach(metric => loadTest.addMetricPoint(metric));
      loadTest.completeTest();

      const results = loadTest.getResults();
      expect(results!.status).toBe('completed');
      expect(loadTest.getStatus()).toBe('completed');
      expect(results!.summary.averageLatency).toBe(55); // (50 + 60) / 2
      expect(results!.summary.requestsPerSecond).toBe(110); // (100 + 120) / 2
    });

    it('should stop test early', () => {
      const loadTest = new LoadTest(validLoadTestConfig);
      loadTest.initializeResults();
      loadTest.stopTest();

      const results = loadTest.getResults();
      expect(results!.status).toBe('stopped');
      expect(loadTest.getStatus()).toBe('stopped');
    });

    it('should mark test as failed', () => {
      const loadTest = new LoadTest(validLoadTestConfig);
      loadTest.failTest('Test failed');

      const results = loadTest.getResults();
      expect(results!.status).toBe('failed');
      expect(loadTest.getStatus()).toBe('failed');
    });

    it('should validate valid configuration', () => {
      const loadTest = new LoadTest(validLoadTestConfig);
      const validation = loadTest.validate();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should validate invalid concurrent users', () => {
      const invalidConfig = { ...validLoadTestConfig, concurrentUsers: 0 };
      const loadTest = new LoadTest(invalidConfig);
      const validation = loadTest.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('At least 1 concurrent user is required'))).toBe(true);
    });

    it('should validate maximum concurrent users', () => {
      const invalidConfig = { ...validLoadTestConfig, concurrentUsers: 15000 };
      const loadTest = new LoadTest(invalidConfig);
      const validation = loadTest.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('Maximum 10,000 concurrent users allowed'))).toBe(true);
    });

    it('should validate invalid duration', () => {
      const invalidConfig = { ...validLoadTestConfig, duration: 0 };
      const loadTest = new LoadTest(invalidConfig);
      const validation = loadTest.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('Duration must be at least 1 second'))).toBe(true);
    });

    it('should validate ramp-up time vs duration', () => {
      const invalidConfig = { ...validLoadTestConfig, rampUpTime: 70, duration: 60 };
      const loadTest = new LoadTest(invalidConfig);
      const validation = loadTest.validate();

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('Ramp-up time must be less than test duration'))).toBe(true);
    });

    it('should serialize to JSON', () => {
      const loadTest = new LoadTest(validLoadTestConfig);
      loadTest.initializeResults();
      const json = loadTest.toJSON();
      const parsed = JSON.parse(json);

      expect(parsed.config.concurrentUsers).toBe(validLoadTestConfig.concurrentUsers);
      expect(parsed.status).toBe('running');
      expect(typeof parsed.config.createdAt).toBe('string');
    });

    it('should deserialize from JSON', () => {
      const loadTest = new LoadTest(validLoadTestConfig);
      loadTest.initializeResults();
      const json = loadTest.toJSON();
      const deserialized = LoadTest.fromJSON(json);
      const config = deserialized.getConfig();

      expect(config.concurrentUsers).toBe(validLoadTestConfig.concurrentUsers);
      expect(config.createdAt).toBeInstanceOf(Date);
      expect(deserialized.getStatus()).toBe('running');
    });
  });

  describe('Validation Functions', () => {
    it('should validate valid LoadTestConfig', () => {
      const result = validateLoadTestConfig(validLoadTestConfig);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(validLoadTestConfig);
      expect(result.errors).toBeUndefined();
    });

    it('should validate invalid LoadTestConfig', () => {
      const invalidConfig = { ...validLoadTestConfig, concurrentUsers: -1 };
      const result = validateLoadTestConfig(invalidConfig);

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toBeDefined();
    });

    it('should validate StartLoadTestRequest', () => {
      const request = {
        target: validApiTestConfig,
        config: {
          concurrentUsers: 10,
          duration: 60,
          rampUpTime: 10,
        },
      };

      const result = validateStartLoadTestRequest(request);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(request);
    });

    it('should validate invalid StartLoadTestRequest', () => {
      const request = {
        target: validApiTestConfig,
        config: {
          concurrentUsers: 10,
          duration: 60,
          rampUpTime: 70, // Invalid: ramp-up time >= duration
        },
      };

      const result = validateStartLoadTestRequest(request);

      expect(result.success).toBe(false);
      expect(result.errors!.some(error => error.includes('Ramp-up time must be less than test duration'))).toBe(true);
    });

    it('should validate MetricPoint', () => {
      const metric: MetricPoint = {
        timestamp: Date.now(),
        requestsPerSecond: 100,
        averageLatency: 50,
        errorRate: 0.01,
        activeUsers: 10,
      };

      const result = validateMetricPoint(metric);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(metric);
    });

    it('should validate invalid MetricPoint', () => {
      const invalidMetric = {
        timestamp: -1, // Invalid: negative timestamp
        requestsPerSecond: 100,
        averageLatency: 50,
        errorRate: 0.01,
        activeUsers: 10,
      };

      const result = validateMetricPoint(invalidMetric);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('Percentile Calculation', () => {
    it('should calculate percentiles correctly', () => {
      const loadTest = new LoadTest(validLoadTestConfig);
      loadTest.initializeResults();

      // Add metrics with known latency values
      const latencies = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      latencies.forEach((latency, index) => {
        loadTest.addMetricPoint({
          timestamp: Date.now() + index * 1000,
          requestsPerSecond: 100,
          averageLatency: latency,
          errorRate: 0,
          activeUsers: 10,
        });
      });

      loadTest.completeTest();
      const results = loadTest.getResults();

      expect(results!.summary.p95Latency).toBe(100); // 95th percentile of [10...100]
      expect(results!.summary.p99Latency).toBe(100); // 99th percentile of [10...100]
      expect(results!.summary.maxLatency).toBe(100);
    });
  });
});