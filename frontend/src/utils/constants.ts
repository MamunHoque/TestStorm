// Application constants

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] as const;

export const AUTH_TYPES = [
  { value: 'none', label: 'No Authentication' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'apikey', label: 'API Key' },
  { value: 'basic', label: 'Basic Auth' },
] as const;

export const EXPORT_FORMATS = [
  { value: 'json', label: 'JSON', extension: '.json' },
  { value: 'csv', label: 'CSV', extension: '.csv' },
  { value: 'pdf', label: 'PDF Report', extension: '.pdf' },
] as const;

export const LOAD_TEST_PRESETS = [
  {
    name: 'Quick Test',
    virtualUsers: 10,
    rampUpTime: 10,
    duration: 60,
  },
  {
    name: 'Baseline Test',
    virtualUsers: 100,
    rampUpTime: 30,
    duration: 300,
  },
  {
    name: 'Stress Test',
    virtualUsers: 500,
    rampUpTime: 60,
    duration: 600,
  },
  {
    name: 'Spike Test',
    virtualUsers: 1000,
    rampUpTime: 10,
    duration: 120,
  },
] as const;

export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent': 'API-Load-Tester/1.0',
} as const;

export const COMMON_API_HEADERS = [
  'Authorization',
  'Content-Type',
  'Accept',
  'User-Agent',
  'X-API-Key',
  'X-Requested-With',
  'Cache-Control',
  'If-None-Match',
  'If-Modified-Since',
] as const;

export const RESPONSE_TIME_THRESHOLDS = {
  excellent: 200,   // < 200ms
  good: 500,        // 200-500ms
  acceptable: 1000, // 500ms-1s
  poor: 2000,       // 1-2s
  // > 2s is considered very poor
} as const;

export const SUCCESS_RATE_THRESHOLDS = {
  excellent: 99.5,  // >= 99.5%
  good: 99.0,       // >= 99%
  acceptable: 95.0, // >= 95%
  poor: 90.0,       // >= 90%
  // < 90% is considered very poor
} as const;

export const VIRTUAL_USER_LIMITS = {
  min: 1,
  max: 10000,
  warning: 1000,    // Show warning above this
  recommended: 500, // Recommended maximum for most tests
} as const;

export const TEST_DURATION_LIMITS = {
  min: 1,           // 1 second
  max: 3600,        // 1 hour
  default: 300,     // 5 minutes
  recommended: 600, // 10 minutes
} as const;

export const RAMP_UP_TIME_LIMITS = {
  min: 0,
  max: 300,         // 5 minutes
  default: 30,      // 30 seconds
} as const;

export const TIMEOUT_LIMITS = {
  min: 1000,        // 1 second
  max: 300000,      // 5 minutes
  default: 30000,   // 30 seconds
} as const;

export const CHART_COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#6366f1',
  gray: '#6b7280',
} as const;

export const STATUS_COLORS = {
  success: 'text-green-600 bg-green-100',
  error: 'text-red-600 bg-red-100',
  warning: 'text-yellow-600 bg-yellow-100',
  info: 'text-blue-600 bg-blue-100',
  idle: 'text-gray-600 bg-gray-100',
  running: 'text-blue-600 bg-blue-100',
  completed: 'text-green-600 bg-green-100',
  failed: 'text-red-600 bg-red-100',
  stopped: 'text-yellow-600 bg-yellow-100',
} as const;

export const LOCAL_STORAGE_KEYS = {
  theme: 'api-load-tester-theme',
  apiTestHistory: 'api-load-tester-api-history',
  loadTestHistory: 'api-load-tester-load-history',
  savedConfigs: 'api-load-tester-saved-configs',
  userPreferences: 'api-load-tester-preferences',
} as const;