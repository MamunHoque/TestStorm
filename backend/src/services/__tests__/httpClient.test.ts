import { HttpClientService } from '../httpClient';
import { TestEndpointRequest } from '../../models/ApiTest';

describe('HttpClientService', () => {
  let httpClient: HttpClientService;

  beforeEach(() => {
    httpClient = new HttpClientService();
  });

  describe('validateRequest', () => {
    it('should validate a correct request', () => {
      const request: TestEndpointRequest = {
        url: 'https://api.example.com/test',
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        queryParams: { param: 'value' },
      };

      const result = httpClient.validateRequest(request);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid URL', () => {
      const request: TestEndpointRequest = {
        url: 'invalid-url',
        method: 'GET',
        headers: {},
        queryParams: {},
      };

      const result = httpClient.validateRequest(request);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid URL format');
    });

    it('should reject non-HTTP/HTTPS protocols', () => {
      const request: TestEndpointRequest = {
        url: 'ftp://example.com/file',
        method: 'GET',
        headers: {},
        queryParams: {},
      };

      const result = httpClient.validateRequest(request);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('URL must use HTTP or HTTPS protocol');
    });

    it('should reject invalid HTTP method', () => {
      const request = {
        url: 'https://api.example.com/test',
        method: 'INVALID',
        headers: {},
        queryParams: {},
      } as any;

      const result = httpClient.validateRequest(request);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid HTTP method');
    });

    it('should reject empty header names', () => {
      const request: TestEndpointRequest = {
        url: 'https://api.example.com/test',
        method: 'GET',
        headers: { '': 'value', ' ': 'another-value' },
        queryParams: {},
      };

      const result = httpClient.validateRequest(request);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Header name cannot be empty');
    });

    it('should reject header names with spaces', () => {
      const request: TestEndpointRequest = {
        url: 'https://api.example.com/test',
        method: 'GET',
        headers: { 'invalid header': 'value' },
        queryParams: {},
      };

      const result = httpClient.validateRequest(request);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Header name "invalid header" cannot contain spaces');
    });

    describe('Authentication Validation', () => {
      it('should validate bearer token authentication', () => {
        const request: TestEndpointRequest = {
          url: 'https://api.example.com/test',
          method: 'GET',
          headers: {},
          queryParams: {},
          auth: {
            type: 'bearer',
            credentials: { token: 'valid-token' },
          },
        };

        const result = httpClient.validateRequest(request);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject bearer auth without token', () => {
        const request: TestEndpointRequest = {
          url: 'https://api.example.com/test',
          method: 'GET',
          headers: {},
          queryParams: {},
          auth: {
            type: 'bearer',
            credentials: {},
          },
        };

        const result = httpClient.validateRequest(request);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Bearer token is required');
      });

      it('should validate API key authentication', () => {
        const request: TestEndpointRequest = {
          url: 'https://api.example.com/test',
          method: 'GET',
          headers: {},
          queryParams: {},
          auth: {
            type: 'apikey',
            credentials: { key: 'X-API-Key', value: 'secret-key' },
          },
        };

        const result = httpClient.validateRequest(request);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject API key auth without key or value', () => {
        const request: TestEndpointRequest = {
          url: 'https://api.example.com/test',
          method: 'GET',
          headers: {},
          queryParams: {},
          auth: {
            type: 'apikey',
            credentials: { key: 'X-API-Key' },
          },
        };

        const result = httpClient.validateRequest(request);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('API key name and value are required');
      });

      it('should validate basic authentication', () => {
        const request: TestEndpointRequest = {
          url: 'https://api.example.com/test',
          method: 'GET',
          headers: {},
          queryParams: {},
          auth: {
            type: 'basic',
            credentials: { username: 'user', password: 'pass' },
          },
        };

        const result = httpClient.validateRequest(request);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject basic auth without username or password', () => {
        const request: TestEndpointRequest = {
          url: 'https://api.example.com/test',
          method: 'GET',
          headers: {},
          queryParams: {},
          auth: {
            type: 'basic',
            credentials: { username: 'user' },
          },
        };

        const result = httpClient.validateRequest(request);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Username and password are required for basic auth');
      });
    });

    describe('JSON Body Validation', () => {
      it('should validate valid JSON body with JSON content-type', () => {
        const request: TestEndpointRequest = {
          url: 'https://api.example.com/test',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          queryParams: {},
          body: '{"key": "value"}',
        };

        const result = httpClient.validateRequest(request);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject invalid JSON body with JSON content-type', () => {
        const request: TestEndpointRequest = {
          url: 'https://api.example.com/test',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          queryParams: {},
          body: '{"invalid": json}',
        };

        const result = httpClient.validateRequest(request);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Request body must be valid JSON when Content-Type is application/json');
      });

      it('should allow invalid JSON body with non-JSON content-type', () => {
        const request: TestEndpointRequest = {
          url: 'https://api.example.com/test',
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          queryParams: {},
          body: 'plain text body',
        };

        const result = httpClient.validateRequest(request);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should allow invalid JSON body without content-type', () => {
        const request: TestEndpointRequest = {
          url: 'https://api.example.com/test',
          method: 'POST',
          headers: {},
          queryParams: {},
          body: 'plain text body',
        };

        const result = httpClient.validateRequest(request);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should accumulate multiple validation errors', () => {
      const request = {
        url: 'invalid-url',
        method: 'INVALID',
        headers: { '': 'value', 'invalid header': 'value2' },
        queryParams: {},
        auth: {
          type: 'bearer',
          credentials: {},
        },
      } as any;

      const result = httpClient.validateRequest(request);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('Invalid URL format');
      expect(result.errors).toContain('Invalid HTTP method');
      expect(result.errors).toContain('Header name cannot be empty');
      expect(result.errors).toContain('Header name "invalid header" cannot contain spaces');
      expect(result.errors).toContain('Bearer token is required');
    });
  });

  // Note: executeRequest method is tested in integration tests
  // to avoid external dependencies in unit tests
});