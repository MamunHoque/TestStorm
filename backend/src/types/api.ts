// API testing related types
import { HttpMethod, BaseEntity } from './common';
import { AuthenticationConfig } from './auth';

export interface ApiTestConfig {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body?: string;
  authentication: AuthenticationConfig;
  timeout: number; // in milliseconds
  followRedirects: boolean;
  validateSSL: boolean;
}

export interface ApiTestResult extends BaseEntity {
  config: ApiTestConfig;
  response: ApiResponse;
  metrics: ApiTestMetrics;
  status: 'success' | 'error';
  error?: string;
}

export interface ApiResponse {
  statusCode: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  responseTime: number; // in milliseconds
  size: number; // response size in bytes
}

export interface ApiTestMetrics {
  responseTime: number;
  dnsLookup: number;
  tcpConnection: number;
  tlsHandshake: number;
  firstByte: number;
  contentTransfer: number;
  totalTime: number;
}

// GraphQL specific types
export interface GraphQLConfig {
  enabled: boolean;
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}

export interface GraphQLApiTestConfig extends Omit<ApiTestConfig, 'body'> {
  graphql: GraphQLConfig;
}

// API test validation
export interface ApiTestValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// API test history
export interface ApiTestHistoryItem {
  id: string;
  name: string;
  url: string;
  method: HttpMethod;
  status: 'success' | 'error';
  responseTime: number;
  statusCode: number;
  executedAt: Date;
}

// Saved API test configurations
export interface SavedApiTest extends BaseEntity {
  name: string;
  description?: string;
  config: ApiTestConfig;
  tags: string[];
  isFavorite: boolean;
}