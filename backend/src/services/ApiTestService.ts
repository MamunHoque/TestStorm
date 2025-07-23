// API testing service
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiTestConfig, ApiTestResult, ApiTestMetrics, ApiResponse } from '../types/api';
import { AuthenticationConfig } from '../types/auth';
import { logger } from '../utils/logger';

export class ApiTestService {
  private static instance: ApiTestService;

  public static getInstance(): ApiTestService {
    if (!ApiTestService.instance) {
      ApiTestService.instance = new ApiTestService();
    }
    return ApiTestService.instance;
  }

  // Execute single API test
  async executeTest(config: ApiTestConfig): Promise<ApiTestResult> {
    const startTime = Date.now();
    let response: AxiosResponse;
    let metrics: ApiTestMetrics;

    try {
      // Build axios configuration
      const axiosConfig = this.buildAxiosConfig(config);
      
      // Execute request with timing
      const timingStart = process.hrtime.bigint();
      response = await axios(axiosConfig);
      const timingEnd = process.hrtime.bigint();
      
      // Calculate metrics
      metrics = this.calculateMetrics(timingStart, timingEnd, response);

      // Build API response
      const apiResponse: ApiResponse = {
        statusCode: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>,
        body: response.data,
        responseTime: metrics.responseTime,
        size: this.calculateResponseSize(response),
      };

      const result: ApiTestResult = {
        id: this.generateId(),
        config,
        response: apiResponse,
        metrics,
        status: 'success',
        created_at: new Date(startTime),
        updated_at: new Date(),
      };

      logger.info(`API test completed successfully: ${config.method} ${config.url}`, {
        statusCode: response.status,
        responseTime: metrics.responseTime,
      });

      return result;

    } catch (error: any) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Handle axios errors
      if (error.response) {
        // Server responded with error status
        const apiResponse: ApiResponse = {
          statusCode: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers as Record<string, string>,
          body: error.response.data,
          responseTime,
          size: this.calculateResponseSize(error.response),
        };

        metrics = {
          responseTime,
          dnsLookup: 0,
          tcpConnection: 0,
          tlsHandshake: 0,
          firstByte: 0,
          contentTransfer: 0,
          totalTime: responseTime,
        };

        const result: ApiTestResult = {
          id: this.generateId(),
          config,
          response: apiResponse,
          metrics,
          status: 'success', // Still successful HTTP communication
          created_at: new Date(startTime),
          updated_at: new Date(),
        };

        logger.info(`API test completed with error response: ${config.method} ${config.url}`, {
          statusCode: error.response.status,
          responseTime,
        });

        return result;
      } else {
        // Network error or timeout
        const errorMessage = error.code === 'ECONNABORTED' 
          ? 'Request timeout'
          : error.message || 'Network error';

        const result: ApiTestResult = {
          id: this.generateId(),
          config,
          response: {
            statusCode: 0,
            statusText: 'Network Error',
            headers: {},
            body: null,
            responseTime,
            size: 0,
          },
          metrics: {
            responseTime,
            dnsLookup: 0,
            tcpConnection: 0,
            tlsHandshake: 0,
            firstByte: 0,
            contentTransfer: 0,
            totalTime: responseTime,
          },
          status: 'error',
          error: errorMessage,
          created_at: new Date(startTime),
          updated_at: new Date(),
        };

        logger.error(`API test failed: ${config.method} ${config.url}`, {
          error: errorMessage,
          responseTime,
        });

        return result;
      }
    }
  }

  // Build axios configuration from API test config
  private buildAxiosConfig(config: ApiTestConfig): AxiosRequestConfig {
    const axiosConfig: AxiosRequestConfig = {
      method: config.method.toLowerCase() as any,
      url: config.url,
      timeout: config.timeout,
      maxRedirects: config.followRedirects ? 5 : 0,
      validateStatus: () => true, // Accept all status codes
      headers: { ...config.headers },
      params: config.queryParams,
    };

    // Add request body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(config.method) && config.body) {
      try {
        // Try to parse as JSON first
        axiosConfig.data = JSON.parse(config.body);
        if (!axiosConfig.headers['Content-Type']) {
          axiosConfig.headers['Content-Type'] = 'application/json';
        }
      } catch {
        // Use as plain text
        axiosConfig.data = config.body;
        if (!axiosConfig.headers['Content-Type']) {
          axiosConfig.headers['Content-Type'] = 'text/plain';
        }
      }
    }

    // Add authentication
    this.addAuthentication(axiosConfig, config.authentication);

    // SSL validation
    if (!config.validateSSL) {
      axiosConfig.httpsAgent = new (require('https').Agent)({
        rejectUnauthorized: false,
      });
    }

    return axiosConfig;
  }

  // Add authentication to axios config
  private addAuthentication(axiosConfig: AxiosRequestConfig, auth: AuthenticationConfig): void {
    switch (auth.type) {
      case 'bearer':
        axiosConfig.headers!['Authorization'] = `Bearer ${auth.token}`;
        break;
      
      case 'apikey':
        axiosConfig.headers![auth.apiKeyHeader] = auth.apiKey;
        break;
      
      case 'basic':
        const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
        axiosConfig.headers!['Authorization'] = `Basic ${credentials}`;
        break;
      
      case 'none':
      default:
        // No authentication
        break;
    }
  }

  // Calculate detailed metrics
  private calculateMetrics(startTime: bigint, endTime: bigint, response: AxiosResponse): ApiTestMetrics {
    const totalTimeNs = endTime - startTime;
    const totalTimeMs = Number(totalTimeNs) / 1000000; // Convert to milliseconds

    // For now, we'll use simplified metrics
    // In a production environment, you might want to use a library like 'request-stats'
    // or implement more detailed timing using axios interceptors
    return {
      responseTime: Math.round(totalTimeMs),
      dnsLookup: 0, // Would need more detailed timing
      tcpConnection: 0,
      tlsHandshake: 0,
      firstByte: 0,
      contentTransfer: 0,
      totalTime: Math.round(totalTimeMs),
    };
  }

  // Calculate response size
  private calculateResponseSize(response: AxiosResponse): number {
    const contentLength = response.headers['content-length'];
    if (contentLength) {
      return parseInt(contentLength, 10);
    }

    // Estimate size if content-length is not available
    try {
      return Buffer.byteLength(JSON.stringify(response.data), 'utf8');
    } catch {
      return 0;
    }
  }

  // Generate unique ID
  private generateId(): string {
    return `api_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Validate URL accessibility
  async validateUrl(url: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await axios.head(url, {
        timeout: 5000,
        validateStatus: () => true,
      });

      return {
        valid: response.status < 500, // Consider 4xx as valid (accessible but may require auth)
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message || 'URL not accessible',
      };
    }
  }

  // Test connection without full request
  async testConnection(config: Pick<ApiTestConfig, 'url' | 'timeout' | 'validateSSL'>): Promise<{
    success: boolean;
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      const axiosConfig: AxiosRequestConfig = {
        method: 'head',
        url: config.url,
        timeout: config.timeout,
        validateStatus: () => true,
      };

      if (!config.validateSSL) {
        axiosConfig.httpsAgent = new (require('https').Agent)({
          rejectUnauthorized: false,
        });
      }

      await axios(axiosConfig);
      const responseTime = Date.now() - startTime;

      return {
        success: true,
        responseTime,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      return {
        success: false,
        responseTime,
        error: error.message || 'Connection failed',
      };
    }
  }
}