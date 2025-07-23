// Frontend API service for communicating with backend
import axios, { AxiosResponse } from 'axios';
import { ApiTestConfig, ApiTestResult } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export class ApiService {
  // Execute API test
  static async executeApiTest(config: ApiTestConfig): Promise<ApiTestResult> {
    try {
      const response: AxiosResponse<ApiResponse<ApiTestResult>> = await apiClient.post(
        '/v1/api-test/execute',
        config
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'API test failed');
      }

      return response.data.data!;
    } catch (error: any) {
      console.error('Execute API test failed:', error);
      throw new Error(error.response?.data?.message || error.message || 'API test execution failed');
    }
  }

  // Validate URL accessibility
  static async validateUrl(url: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const response: AxiosResponse<ApiResponse<{ valid: boolean; error?: string }>> = await apiClient.post(
        '/v1/api-test/validate',
        { url }
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'URL validation failed');
      }

      return response.data.data!;
    } catch (error: any) {
      console.error('URL validation failed:', error);
      throw new Error(error.response?.data?.message || error.message || 'URL validation failed');
    }
  }

  // Test connection to endpoint
  static async testConnection(config: {
    url: string;
    timeout?: number;
    validateSSL?: boolean;
  }): Promise<{ success: boolean; responseTime: number; error?: string }> {
    try {
      const response: AxiosResponse<ApiResponse<{
        success: boolean;
        responseTime: number;
        error?: string;
      }>> = await apiClient.post('/v1/api-test/test-connection', config);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Connection test failed');
      }

      return response.data.data!;
    } catch (error: any) {
      console.error('Connection test failed:', error);
      throw new Error(error.response?.data?.message || error.message || 'Connection test failed');
    }
  }

  // Get supported methods and auth types
  static async getSupportedMethods(): Promise<{
    methods: string[];
    authTypes: Array<{ value: string; label: string }>;
  }> {
    try {
      const response: AxiosResponse<ApiResponse<{
        methods: string[];
        authTypes: Array<{ value: string; label: string }>;
      }>> = await apiClient.get('/v1/api-test/methods');

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get supported methods');
      }

      return response.data.data!;
    } catch (error: any) {
      console.error('Get supported methods failed:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to get supported methods');
    }
  }

  // Health check
  static async healthCheck(): Promise<any> {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error: any) {
      console.error('Health check failed:', error);
      throw new Error(error.response?.data?.message || error.message || 'Health check failed');
    }
  }
}

export default ApiService;