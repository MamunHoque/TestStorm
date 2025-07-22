// HTTP Methods supported by the application
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Authentication types
export type AuthType = 'bearer' | 'apikey' | 'basic';

// Authentication configuration interface
export interface AuthConfig {
  type: AuthType;
  credentials: Record<string, string>;
}

// API Test Configuration interface
export interface ApiTestConfig {
  id?: string;
  name: string;
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body?: string;
  authentication?: AuthConfig;
  createdAt: Date;
  updatedAt: Date;
}

// API Test Response interface
export interface ApiTestResponse {
  statusCode: number;
  responseTime: number;
  headers: Record<string, string>;
  body: any;
  error?: string;
  timestamp: Date;
}

// Test endpoint request interface
export interface TestEndpointRequest {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body?: string;
  auth?: AuthConfig;
}

// Test endpoint response interface
export interface TestEndpointResponse {
  statusCode: number;
  responseTime: number;
  headers: Record<string, string>;
  body: any;
  error?: string;
}

// API Test class for business logic
export class ApiTest {
  private config: ApiTestConfig;

  constructor(config: ApiTestConfig) {
    this.config = {
      ...config,
      id: config.id || this.generateId(),
      createdAt: config.createdAt || new Date(),
      updatedAt: new Date(),
    };
  }

  // Generate unique ID for the test
  private generateId(): string {
    return `api_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get test configuration
  getConfig(): ApiTestConfig {
    return { ...this.config };
  }

  // Update test configuration
  updateConfig(updates: Partial<ApiTestConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
      updatedAt: new Date(),
    };
  }

  // Validate the test configuration
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate URL
    if (!this.config.url) {
      errors.push('URL is required');
    } else {
      try {
        const url = new URL(this.config.url);
        if (!['http:', 'https:'].includes(url.protocol)) {
          errors.push('URL must use HTTP or HTTPS protocol');
        }
      } catch {
        errors.push('Invalid URL format');
      }
    }

    // Validate name
    if (!this.config.name || this.config.name.trim().length === 0) {
      errors.push('Test name is required');
    }

    // Validate method
    const validMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    if (!validMethods.includes(this.config.method)) {
      errors.push('Invalid HTTP method');
    }

    // Validate headers
    Object.entries(this.config.headers).forEach(([key, value]) => {
      if (!key.trim()) {
        errors.push('Header name cannot be empty');
      }
      if (key.includes(' ')) {
        errors.push(`Header name "${key}" cannot contain spaces`);
      }
    });

    // Validate authentication
    if (this.config.authentication) {
      const auth = this.config.authentication;
      switch (auth.type) {
        case 'bearer':
          if (!auth.credentials.token) {
            errors.push('Bearer token is required');
          }
          break;
        case 'apikey':
          if (!auth.credentials.key || !auth.credentials.value) {
            errors.push('API key name and value are required');
          }
          break;
        case 'basic':
          if (!auth.credentials.username || !auth.credentials.password) {
            errors.push('Username and password are required for basic auth');
          }
          break;
      }
    }

    // Validate JSON body if present
    if (this.config.body) {
      try {
        JSON.parse(this.config.body);
      } catch {
        errors.push('Request body must be valid JSON');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Convert to JSON for storage/transmission
  toJSON(): string {
    return JSON.stringify({
      ...this.config,
      createdAt: this.config.createdAt.toISOString(),
      updatedAt: this.config.updatedAt.toISOString(),
    });
  }

  // Create from JSON
  static fromJSON(json: string): ApiTest {
    const data = JSON.parse(json);
    return new ApiTest({
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    });
  }
}