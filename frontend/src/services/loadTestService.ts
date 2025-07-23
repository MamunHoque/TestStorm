// Frontend load test service
import axios, { AxiosResponse } from 'axios';
import { LoadTestConfig, LoadTestExecution } from '../types/loadTest';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Longer timeout for load test operations
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface LoadTestStartResponse {
  testId: string;
  execution: LoadTestExecution;
}

export interface LoadTestStatusResponse {
  testId: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'stopped';
  execution?: LoadTestExecution;
}

export interface RunningTestsResponse {
  count: number;
  tests: Array<{
    testId: string;
    execution?: LoadTestExecution;
    status: string;
  }>;
}

export interface LoadTestPreset {
  name: string;
  description: string;
  config: Partial<LoadTestConfig>;
}

export class LoadTestService {
  // Start a load test
  static async startLoadTest(config: LoadTestConfig): Promise<LoadTestStartResponse> {
    try {
      const response: AxiosResponse<ApiResponse<LoadTestStartResponse>> = await apiClient.post(
        '/v1/load-test/start',
        config
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Load test start failed');
      }

      return response.data.data!;
    } catch (error: any) {
      console.error('Start load test failed:', error);
      throw new Error(error.response?.data?.message || error.message || 'Load test start failed');
    }
  }

  // Stop a load test
  static async stopLoadTest(testId: string): Promise<{ testId: string; stopped: boolean }> {
    try {
      const response: AxiosResponse<ApiResponse<{ testId: string; stopped: boolean }>> = await apiClient.post(
        `/v1/load-test/stop/${testId}`
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Load test stop failed');
      }

      return response.data.data!;
    } catch (error: any) {
      console.error('Stop load test failed:', error);
      throw new Error(error.response?.data?.message || error.message || 'Load test stop failed');
    }
  }

  // Get load test status
  static async getLoadTestStatus(testId: string): Promise<LoadTestStatusResponse> {
    try {
      const response: AxiosResponse<ApiResponse<LoadTestStatusResponse>> = await apiClient.get(
        `/v1/load-test/status/${testId}`
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get test status');
      }

      return response.data.data!;
    } catch (error: any) {
      console.error('Get load test status failed:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to get test status');
    }
  }

  // Get running tests
  static async getRunningTests(): Promise<RunningTestsResponse> {
    try {
      const response: AxiosResponse<ApiResponse<RunningTestsResponse>> = await apiClient.get(
        '/v1/load-test/running'
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get running tests');
      }

      return response.data.data!;
    } catch (error: any) {
      console.error('Get running tests failed:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to get running tests');
    }
  }

  // Get load test presets
  static async getLoadTestPresets(): Promise<LoadTestPreset[]> {
    try {
      const response: AxiosResponse<ApiResponse<LoadTestPreset[]>> = await apiClient.get(
        '/v1/load-test/presets'
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get presets');
      }

      return response.data.data!;
    } catch (error: any) {
      console.error('Get load test presets failed:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to get presets');
    }
  }

  // Validate load test configuration
  static async validateLoadTestConfig(config: LoadTestConfig): Promise<{ valid: boolean }> {
    try {
      const response: AxiosResponse<ApiResponse<{ valid: boolean }>> = await apiClient.post(
        '/v1/load-test/validate',
        config
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Configuration validation failed');
      }

      return response.data.data!;
    } catch (error: any) {
      console.error('Validate load test config failed:', error);
      throw new Error(error.response?.data?.message || error.message || 'Configuration validation failed');
    }
  }

  // Get WebSocket connection statistics
  static async getWebSocketStats(): Promise<any> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await apiClient.get(
        '/v1/websocket/stats'
      );

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get WebSocket stats');
      }

      return response.data.data!;
    } catch (error: any) {
      console.error('Get WebSocket stats failed:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to get WebSocket stats');
    }
  }
}

export default LoadTestService;