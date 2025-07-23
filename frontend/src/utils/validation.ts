// Frontend validation utilities
import { ApiTestConfig, LoadTestConfig, AuthenticationConfig } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// API Test Configuration Validation
export function validateApiTestConfig(config: Partial<ApiTestConfig>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // URL validation
  if (!config.url) {
    errors.push('URL is required');
  } else if (!isValidUrl(config.url)) {
    errors.push('Invalid URL format');
  }

  // Method validation
  if (!config.method) {
    errors.push('HTTP method is required');
  }

  // Authentication validation
  if (config.authentication) {
    const authValidation = validateAuthConfig(config.authentication);
    errors.push(...authValidation.errors);
    warnings.push(...authValidation.warnings);
  }

  // Timeout validation
  if (config.timeout !== undefined) {
    if (config.timeout < 1000) {
      errors.push('Timeout must be at least 1000ms');
    } else if (config.timeout > 300000) {
      errors.push('Timeout cannot exceed 300000ms (5 minutes)');
    }
  }

  // Headers validation
  if (config.headers) {
    const headerValidation = validateHeaders(config.headers);
    errors.push(...headerValidation.errors);
    warnings.push(...headerValidation.warnings);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Load Test Configuration Validation
export function validateLoadTestConfig(config: Partial<LoadTestConfig>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Name validation
  if (!config.name?.trim()) {
    errors.push('Test name is required');
  } else if (config.name.length > 100) {
    errors.push('Test name cannot exceed 100 characters');
  }

  // Target validation
  if (config.target) {
    if (!config.target.url) {
      errors.push('Target URL is required');
    } else if (!isValidUrl(config.target.url)) {
      errors.push('Invalid target URL format');
    }

    if (!config.target.method) {
      errors.push('HTTP method is required');
    }
  } else {
    errors.push('Target configuration is required');
  }

  // Load configuration validation
  if (config.load) {
    const { virtualUsers, rampUpTime, duration } = config.load;

    if (virtualUsers !== undefined) {
      if (virtualUsers < 1) {
        errors.push('At least 1 virtual user is required');
      } else if (virtualUsers > 10000) {
        errors.push('Maximum 10,000 virtual users allowed');
      } else if (virtualUsers > 1000) {
        warnings.push('High virtual user count may impact performance');
      }
    }

    if (rampUpTime !== undefined) {
      if (rampUpTime < 0) {
        errors.push('Ramp-up time cannot be negative');
      } else if (rampUpTime > 300) {
        errors.push('Maximum ramp-up time is 300 seconds');
      }
    }

    if (duration !== undefined) {
      if (duration < 1) {
        errors.push('Minimum test duration is 1 second');
      } else if (duration > 3600) {
        errors.push('Maximum test duration is 3600 seconds (1 hour)');
      }

      // Validate duration based on virtual users
      if (virtualUsers && !validateTestDurationByUsers(virtualUsers, duration)) {
        errors.push('Test duration too long for the number of virtual users');
      }
    }
  } else {
    errors.push('Load configuration is required');
  }

  // Authentication validation
  if (config.authentication) {
    const authValidation = validateAuthConfig(config.authentication);
    errors.push(...authValidation.errors);
    warnings.push(...authValidation.warnings);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Authentication Configuration Validation
export function validateAuthConfig(auth: Partial<AuthenticationConfig>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!auth.type) {
    errors.push('Authentication type is required');
    return { isValid: false, errors, warnings };
  }

  switch (auth.type) {
    case 'bearer':
      if (!auth.token?.trim()) {
        errors.push('Bearer token is required');
      } else if (auth.token.length < 10) {
        warnings.push('Bearer token seems too short');
      }
      break;

    case 'apikey':
      if (!auth.apiKey?.trim()) {
        errors.push('API key is required');
      }
      if (!auth.apiKeyHeader?.trim()) {
        errors.push('API key header name is required');
      }
      break;

    case 'basic':
      if (!auth.username?.trim()) {
        errors.push('Username is required for basic auth');
      }
      if (!auth.password?.trim()) {
        errors.push('Password is required for basic auth');
      }
      break;

    case 'none':
      // No validation needed for no auth
      break;

    default:
      errors.push('Invalid authentication type');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// Helper validation functions
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function validateHeaders(headers: Record<string, string>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const [name, value] of Object.entries(headers)) {
    if (!name.trim()) {
      errors.push('Header name cannot be empty');
      continue;
    }

    // Check for invalid header name characters
    if (!/^[a-zA-Z0-9\-_]+$/.test(name)) {
      errors.push(`Invalid header name: ${name}`);
    }

    // Check for common header mistakes
    if (name.toLowerCase() === 'content-length') {
      warnings.push('Content-Length header will be set automatically');
    }

    if (name.toLowerCase() === 'host') {
      warnings.push('Host header will be set automatically');
    }

    if (typeof value !== 'string') {
      errors.push(`Header value must be a string: ${name}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateTestDurationByUsers(virtualUsers: number, duration: number): boolean {
  // Limit test duration based on virtual users to prevent resource exhaustion
  const maxDurationByUsers = [
    { userLimit: 1000, timeLimit: 3600 },   // 1 hour for up to 1k users
    { userLimit: 5000, timeLimit: 1800 },   // 30 min for up to 5k users
    { userLimit: 10000, timeLimit: 900 },   // 15 min for up to 10k users
  ];

  for (const { userLimit, timeLimit } of maxDurationByUsers) {
    if (virtualUsers <= userLimit) {
      return duration <= timeLimit;
    }
  }

  return false;
}

// Form validation helpers
export function validateRequired(value: any, fieldName: string): string | null {
  if (value === undefined || value === null || value === '') {
    return `${fieldName} is required`;
  }
  return null;
}

export function validateMinLength(value: string, minLength: number, fieldName: string): string | null {
  if (value && value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }
  return null;
}

export function validateMaxLength(value: string, maxLength: number, fieldName: string): string | null {
  if (value && value.length > maxLength) {
    return `${fieldName} cannot exceed ${maxLength} characters`;
  }
  return null;
}

export function validateRange(value: number, min: number, max: number, fieldName: string): string | null {
  if (value < min || value > max) {
    return `${fieldName} must be between ${min} and ${max}`;
  }
  return null;
}