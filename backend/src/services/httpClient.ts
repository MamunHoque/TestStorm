import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { TestEndpointRequest, TestEndpointResponse, AuthConfig } from '../models/ApiTest';

export class HttpClientService {
  private client: AxiosInstance;
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_REDIRECTS = 5;

  constructor() {
    this.client = axios.create({
      timeout: this.DEFAULT_TIMEOUT,
      maxRedirects: this.MAX_REDIRECTS,
      validateStatus: () => true, // Don't throw on any status code
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[HTTP Client] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[HTTP Client] Request error:', error.message);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[HTTP Client] Response ${response.status} from ${response.config.url} (${response.headers['content-length'] || 'unknown'} bytes)`);
        return response;
      },
      (error) => {
        console.error('[HTTP Client] Response error:', error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Execute an API test request
   */
  async executeRequest(request: TestEndpointRequest): Promise<TestEndpointResponse> {
    const startTime = Date.now();

    try {
      // Build the request configuration
      const config = await this.buildRequestConfig(request);
      
      // Execute the request
      const response = await this.client.request(config);
      const responseTime = Date.now() - startTime;

      // Build the response object
      return this.buildResponse(response, responseTime);

    } catch (error) {
      const responseTime = Date.now() - startTime;
      return this.handleError(error as AxiosError, responseTime);
    }
  }

  /**
   * Build Axios request configuration from test request
   */
  private async buildRequestConfig(request: TestEndpointRequest): Promise<AxiosRequestConfig> {
    const config: AxiosRequestConfig = {
      method: request.method.toLowerCase() as any,
      url: this.buildUrlWithParams(request.url, request.queryParams),
      headers: { ...request.headers },
    };

    // Add request body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.body) {
      config.data = request.body;
      
      // Set content-type if not already specified
      if (!config.headers!['content-type'] && !config.headers!['Content-Type']) {
        try {
          JSON.parse(request.body);
          config.headers!['Content-Type'] = 'application/json';
        } catch {
          config.headers!['Content-Type'] = 'text/plain';
        }
      }
    }

    // Add authentication
    if (request.auth) {
      this.addAuthentication(config, request.auth);
    }

    return config;
  }

  /**
   * Build URL with query parameters
   */
  private buildUrlWithParams(baseUrl: string, queryParams: Record<string, string>): string {
    const url = new URL(baseUrl);
    
    Object.entries(queryParams).forEach(([key, value]) => {
      if (key && value) {
        url.searchParams.set(key, value);
      }
    });

    return url.toString();
  }

  /**
   * Add authentication to request configuration
   */
  private addAuthentication(config: AxiosRequestConfig, auth: AuthConfig): void {
    switch (auth.type) {
      case 'bearer':
        if (auth.credentials.token) {
          config.headers!['Authorization'] = `Bearer ${auth.credentials.token}`;
        }
        break;

      case 'apikey':
        if (auth.credentials.key && auth.credentials.value) {
          config.headers![auth.credentials.key] = auth.credentials.value;
        }
        break;

      case 'basic':
        if (auth.credentials.username && auth.credentials.password) {
          const credentials = Buffer.from(
            `${auth.credentials.username}:${auth.credentials.password}`
          ).toString('base64');
          config.headers!['Authorization'] = `Basic ${credentials}`;
        }
        break;

      default:
        console.warn(`[HTTP Client] Unknown authentication type: ${auth.type}`);
    }
  }

  /**
   * Build response object from Axios response
   */
  private buildResponse(response: AxiosResponse, responseTime: number): TestEndpointResponse {
    return {
      statusCode: response.status,
      responseTime,
      headers: this.normalizeHeaders(response.headers),
      body: this.parseResponseBody(response),
    };
  }

  /**
   * Handle request errors and build error response
   */
  private handleError(error: AxiosError, responseTime: number): TestEndpointResponse {
    // Network or timeout errors
    if (!error.response) {
      let errorMessage = 'Network error';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout';
      } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'Host not found';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        statusCode: 0,
        responseTime,
        headers: {},
        body: null,
        error: errorMessage,
      };
    }

    // HTTP error responses (4xx, 5xx)
    return {
      statusCode: error.response.status,
      responseTime,
      headers: this.normalizeHeaders(error.response.headers),
      body: this.parseResponseBody(error.response),
      error: `HTTP ${error.response.status} ${error.response.statusText}`,
    };
  }

  /**
   * Normalize response headers to Record<string, string>
   */
  private normalizeHeaders(headers: any): Record<string, string> {
    const normalized: Record<string, string> = {};
    
    Object.entries(headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        normalized[key.toLowerCase()] = value;
      } else if (Array.isArray(value)) {
        normalized[key.toLowerCase()] = value.join(', ');
      } else if (value !== undefined) {
        normalized[key.toLowerCase()] = String(value);
      }
    });

    return normalized;
  }

  /**
   * Parse response body based on content type
   */
  private parseResponseBody(response: AxiosResponse): any {
    const contentType = response.headers['content-type'] || '';

    // Handle empty responses
    if (!response.data) {
      return null;
    }

    // If data is already parsed (JSON), return as-is
    if (typeof response.data === 'object') {
      return response.data;
    }

    // Handle text responses
    if (contentType.includes('text/') || contentType.includes('application/json')) {
      try {
        return JSON.parse(response.data);
      } catch {
        return response.data;
      }
    }

    // Handle binary data
    if (contentType.includes('application/octet-stream') || 
        contentType.includes('image/') || 
        contentType.includes('video/') || 
        contentType.includes('audio/')) {
      return '[Binary data]';
    }

    // Default: return as string
    return String(response.data);
  }

  /**
   * Validate request before execution
   */
  validateRequest(request: TestEndpointRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate URL
    try {
      const url = new URL(request.url);
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.push('URL must use HTTP or HTTPS protocol');
      }
    } catch {
      errors.push('Invalid URL format');
    }

    // Validate method
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    if (!validMethods.includes(request.method)) {
      errors.push('Invalid HTTP method');
    }

    // Validate headers
    Object.entries(request.headers).forEach(([key, value]) => {
      if (!key.trim()) {
        errors.push('Header name cannot be empty');
      }
      if (key.includes(' ')) {
        errors.push(`Header name "${key}" cannot contain spaces`);
      }
    });

    // Validate authentication
    if (request.auth) {
      switch (request.auth.type) {
        case 'bearer':
          if (!request.auth.credentials.token) {
            errors.push('Bearer token is required');
          }
          break;
        case 'apikey':
          if (!request.auth.credentials.key || !request.auth.credentials.value) {
            errors.push('API key name and value are required');
          }
          break;
        case 'basic':
          if (!request.auth.credentials.username || !request.auth.credentials.password) {
            errors.push('Username and password are required for basic auth');
          }
          break;
      }
    }

    // Validate JSON body if present
    if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        JSON.parse(request.body);
      } catch {
        // Only validate as JSON if Content-Type suggests it
        const contentType = request.headers['content-type'] || request.headers['Content-Type'] || '';
        if (contentType.includes('application/json')) {
          errors.push('Request body must be valid JSON when Content-Type is application/json');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}