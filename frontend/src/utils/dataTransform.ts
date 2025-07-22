import { 
  ApiTestConfig, 
  LoadTestConfig, 
  TestResults, 
  MetricPoint, 
  TestSummary,
  AuthConfig 
} from '@/types/api';

// Transform API test config for storage/transmission
export const serializeApiTestConfig = (config: ApiTestConfig): string => {
  return JSON.stringify({
    ...config,
    createdAt: config.createdAt.toISOString(),
    updatedAt: config.updatedAt.toISOString(),
  });
};

export const deserializeApiTestConfig = (data: string): ApiTestConfig => {
  const parsed = JSON.parse(data);
  return {
    ...parsed,
    createdAt: new Date(parsed.createdAt),
    updatedAt: new Date(parsed.updatedAt),
  };
};

// Transform load test config for storage/transmission
export const serializeLoadTestConfig = (config: LoadTestConfig): string => {
  return JSON.stringify({
    ...config,
    createdAt: config.createdAt.toISOString(),
    apiConfig: {
      ...config.apiConfig,
      createdAt: config.apiConfig.createdAt.toISOString(),
      updatedAt: config.apiConfig.updatedAt.toISOString(),
    },
  });
};

export const deserializeLoadTestConfig = (data: string): LoadTestConfig => {
  const parsed = JSON.parse(data);
  return {
    ...parsed,
    createdAt: new Date(parsed.createdAt),
    apiConfig: {
      ...parsed.apiConfig,
      createdAt: new Date(parsed.apiConfig.createdAt),
      updatedAt: new Date(parsed.apiConfig.updatedAt),
    },
  };
};

// Transform test results for storage/transmission
export const serializeTestResults = (results: TestResults): string => {
  return JSON.stringify({
    ...results,
    startTime: results.startTime.toISOString(),
    endTime: results.endTime.toISOString(),
  });
};

export const deserializeTestResults = (data: string): TestResults => {
  const parsed = JSON.parse(data);
  return {
    ...parsed,
    startTime: new Date(parsed.startTime),
    endTime: new Date(parsed.endTime),
  };
};

// Convert headers object to array format for forms
export const headersToArray = (headers: Record<string, string>) => {
  return Object.entries(headers).map(([key, value]) => ({ key, value }));
};

// Convert array format back to headers object
export const arrayToHeaders = (headerArray: { key: string; value: string }[]) => {
  return headerArray.reduce((acc, { key, value }) => {
    if (key.trim() && value.trim()) {
      acc[key.trim()] = value.trim();
    }
    return acc;
  }, {} as Record<string, string>);
};

// Convert query params object to array format for forms
export const queryParamsToArray = (params: Record<string, string>) => {
  return Object.entries(params).map(([key, value]) => ({ key, value }));
};

// Convert array format back to query params object
export const arrayToQueryParams = (paramArray: { key: string; value: string }[]) => {
  return paramArray.reduce((acc, { key, value }) => {
    if (key.trim()) {
      acc[key.trim()] = value; // Allow empty values for query params
    }
    return acc;
  }, {} as Record<string, string>);
};

// Format authentication config for display
export const formatAuthConfig = (auth?: AuthConfig): string => {
  if (!auth) return 'None';
  
  switch (auth.type) {
    case 'bearer':
      return 'Bearer Token';
    case 'apikey':
      return `API Key (${Object.keys(auth.credentials)[0] || 'Unknown'})`;
    case 'basic':
      return 'Basic Authentication';
    default:
      return 'Unknown';
  }
};

// Calculate test duration in human-readable format
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
};

// Format latency values
export const formatLatency = (ms: number): string => {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  } else {
    return `${(ms / 1000).toFixed(2)}s`;
  }
};

// Format request rate
export const formatRequestRate = (rps: number): string => {
  if (rps < 1000) {
    return `${rps.toFixed(1)} req/s`;
  } else {
    return `${(rps / 1000).toFixed(1)}k req/s`;
  }
};

// Format error rate as percentage
export const formatErrorRate = (rate: number): string => {
  return `${(rate * 100).toFixed(2)}%`;
};

// Generate unique ID for tests
export const generateTestId = (): string => {
  return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Calculate percentiles from an array of values
export const calculatePercentile = (values: number[], percentile: number): number => {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
};

// Calculate test summary from metrics
export const calculateTestSummary = (metrics: MetricPoint[]): TestSummary => {
  if (metrics.length === 0) {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatency: 0,
      p95Latency: 0,
      p99Latency: 0,
      maxLatency: 0,
      requestsPerSecond: 0,
      errorRate: 0,
    };
  }

  const latencies = metrics.map(m => m.averageLatency);
  const totalRequests = metrics.reduce((sum, m) => sum + m.requestsPerSecond, 0);
  const avgErrorRate = metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length;
  
  return {
    totalRequests: Math.round(totalRequests),
    successfulRequests: Math.round(totalRequests * (1 - avgErrorRate)),
    failedRequests: Math.round(totalRequests * avgErrorRate),
    averageLatency: latencies.reduce((sum, l) => sum + l, 0) / latencies.length,
    p95Latency: calculatePercentile(latencies, 95),
    p99Latency: calculatePercentile(latencies, 99),
    maxLatency: Math.max(...latencies),
    requestsPerSecond: totalRequests / metrics.length,
    errorRate: avgErrorRate,
  };
};