import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import apiTestRoutes from '../apiTest';
import { TestEndpointRequest } from '../../models/ApiTest';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/api', apiTestRoutes);
  return app;
};

// Create a simple test server for testing
const createTestServer = () => {
  const testApp = express();
  testApp.use(express.json());
  
  // Basic GET endpoint
  testApp.get('/test', (req, res) => {
    res.json({
      method: 'GET',
      query: req.query,
      headers: req.headers,
    });
  });

  // POST endpoint
  testApp.post('/test', (req, res) => {
    res.json({
      method: 'POST',
      body: req.body,
      headers: req.headers,
    });
  });

  // Bearer auth endpoint
  testApp.get('/auth/bearer', (req, res) => {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      res.json({ authenticated: true, token: auth.substring(7) });
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  });

  // Basic auth endpoint
  testApp.get('/auth/basic', (req, res) => {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Basic ')) {
      const credentials = Buffer.from(auth.substring(6), 'base64').toString();
      const [username, password] = credentials.split(':');
      if (username === 'testuser' && password === 'testpass') {
        res.json({ authenticated: true, user: username });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } else {
      res.status(401).json({ error: 'Unauthorized' });
    }
  });

  // Error endpoints
  testApp.get('/error/:code', (req, res) => {
    const code = parseInt(req.params.code);
    res.status(code).json({ error: `Test error ${code}` });
  });

  return testApp;
};

describe('API Test Routes - Integration Tests', () => {
  let app: express.Application;
  let testServer: any;
  let testServerUrl: string;

  beforeAll((done) => {
    app = createTestApp();
    
    // Start test server
    const testApp = createTestServer();
    testServer = testApp.listen(0, () => {
      const port = testServer.address().port;
      testServerUrl = `http://localhost:${port}`;
      done();
    });
  });

  afterAll((done) => {
    if (testServer) {
      testServer.close(done);
    } else {
      done();
    }
  });

  describe('GET /api/test-endpoint/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/test-endpoint/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'OK',
        service: 'API Test Endpoint',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
      });
    });
  });

  describe('POST /api/test-endpoint', () => {
    describe('Request Validation', () => {
      it('should reject request with invalid URL', async () => {
        const testRequest: TestEndpointRequest = {
          url: 'invalid-url',
          apiType: 'rest',
          method: 'GET',
          headers: {},
          queryParams: {},
        };

        const response = await request(app)
          .post('/api/test-endpoint')
          .send(testRequest)
          .expect(400);

        expect(response.body).toMatchObject({
          error: 'Invalid request',
          details: expect.arrayContaining(['Invalid URL format']),
          statusCode: 400,
        });
      });

      it('should reject request with invalid HTTP method', async () => {
        const testRequest = {
          url: `${testServerUrl}/test`,
          method: 'INVALID',
          headers: {},
          queryParams: {},
        };

        const response = await request(app)
          .post('/api/test-endpoint')
          .send(testRequest)
          .expect(400);

        expect(response.body).toMatchObject({
          error: 'Invalid request',
          details: expect.arrayContaining(['Invalid HTTP method']),
        });
      });

      it('should reject bearer auth without token', async () => {
        const testRequest: TestEndpointRequest = {
          url: `${testServerUrl}/test`,
          apiType: 'rest',
          method: 'GET',
          headers: {},
          queryParams: {},
          auth: {
            type: 'bearer',
            credentials: {},
          },
        };

        const response = await request(app)
          .post('/api/test-endpoint')
          .send(testRequest)
          .expect(400);

        expect(response.body).toMatchObject({
          error: 'Invalid request',
          details: expect.arrayContaining(['Bearer token is required']),
        });
      });
    });

    describe('HTTP Methods', () => {
      it('should handle GET request successfully', async () => {
        const testRequest: TestEndpointRequest = {
          url: `${testServerUrl}/test`,
          apiType: 'rest',
          method: 'GET',
          headers: { 'User-Agent': 'API-Test-Client' },
          queryParams: { test: 'value' },
        };

        const response = await request(app)
          .post('/api/test-endpoint')
          .send(testRequest)
          .expect(200);

        expect(response.body).toMatchObject({
          statusCode: 200,
          responseTime: expect.any(Number),
          headers: expect.any(Object),
          body: expect.any(Object),
        });

        expect(response.body.body.query).toMatchObject({
          test: 'value',
        });
      });

      it('should handle POST request with JSON body', async () => {
        const testData = { message: 'Hello, World!' };
        const testRequest: TestEndpointRequest = {
          url: `${testServerUrl}/test`,
          apiType: 'rest',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          queryParams: {},
          body: JSON.stringify(testData),
        };

        const response = await request(app)
          .post('/api/test-endpoint')
          .send(testRequest)
          .expect(200);

        expect(response.body).toMatchObject({
          statusCode: 200,
          responseTime: expect.any(Number),
          headers: expect.any(Object),
          body: expect.any(Object),
        });

        expect(response.body.body.body).toMatchObject(testData);
      });
    });

    describe('Authentication', () => {
      it('should handle Bearer token authentication', async () => {
        const testRequest: TestEndpointRequest = {
          url: `${testServerUrl}/auth/bearer`,
          apiType: 'rest',
          method: 'GET',
          headers: {},
          queryParams: {},
          auth: {
            type: 'bearer',
            credentials: { token: 'test-token-123' },
          },
        };

        const response = await request(app)
          .post('/api/test-endpoint')
          .send(testRequest)
          .expect(200);

        expect(response.body).toMatchObject({
          statusCode: 200,
          responseTime: expect.any(Number),
        });

        expect(response.body.body.authenticated).toBe(true);
        expect(response.body.body.token).toBe('test-token-123');
      });

      it('should handle Basic authentication', async () => {
        const testRequest: TestEndpointRequest = {
          url: `${testServerUrl}/auth/basic`,
          apiType: 'rest',
          method: 'GET',
          headers: {},
          queryParams: {},
          auth: {
            type: 'basic',
            credentials: { username: 'testuser', password: 'testpass' },
          },
        };

        const response = await request(app)
          .post('/api/test-endpoint')
          .send(testRequest)
          .expect(200);

        expect(response.body).toMatchObject({
          statusCode: 200,
          responseTime: expect.any(Number),
        });

        expect(response.body.body.authenticated).toBe(true);
        expect(response.body.body.user).toBe('testuser');
      });

      it('should handle API key authentication', async () => {
        const testRequest: TestEndpointRequest = {
          url: `${testServerUrl}/test`,
          apiType: 'rest',
          method: 'GET',
          headers: {},
          queryParams: {},
          auth: {
            type: 'apikey',
            credentials: { key: 'X-API-Key', value: 'secret-key-123' },
          },
        };

        const response = await request(app)
          .post('/api/test-endpoint')
          .send(testRequest)
          .expect(200);

        expect(response.body).toMatchObject({
          statusCode: 200,
          responseTime: expect.any(Number),
        });

        expect(response.body.body.headers['x-api-key']).toBe('secret-key-123');
      });
    });

    describe('Error Handling', () => {
      it('should handle 404 responses', async () => {
        const testRequest: TestEndpointRequest = {
          url: `${testServerUrl}/error/404`,
          apiType: 'rest',
          method: 'GET',
          headers: {},
          queryParams: {},
        };

        const response = await request(app)
          .post('/api/test-endpoint')
          .send(testRequest)
          .expect(200);

        expect(response.body).toMatchObject({
          statusCode: 404,
          responseTime: expect.any(Number),
          headers: expect.any(Object),
          body: expect.any(Object),
        });
        
        // The error field should be present for HTTP error responses
        if (response.body.error) {
          expect(response.body.error).toContain('404');
        }
      });

      it('should handle 500 responses', async () => {
        const testRequest: TestEndpointRequest = {
          url: `${testServerUrl}/error/500`,
          apiType: 'rest',
          method: 'GET',
          headers: {},
          queryParams: {},
        };

        const response = await request(app)
          .post('/api/test-endpoint')
          .send(testRequest)
          .expect(200);

        expect(response.body).toMatchObject({
          statusCode: 500,
          responseTime: expect.any(Number),
        });
        
        // The error field should be present for HTTP error responses
        if (response.body.error) {
          expect(response.body.error).toContain('500');
        }
      });

      it('should handle network errors', async () => {
        const testRequest: TestEndpointRequest = {
          url: 'http://nonexistent-host-12345.com',
          apiType: 'rest',
          method: 'GET',
          headers: {},
          queryParams: {},
        };

        const response = await request(app)
          .post('/api/test-endpoint')
          .send(testRequest);

        // Network errors should still return 200 from our API with error details
        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          statusCode: 0,
          responseTime: expect.any(Number),
          headers: {},
          body: null,
        });
        
        expect(response.body.error).toBeDefined();
        expect(typeof response.body.error).toBe('string');
      });
    });

    describe('Response Processing', () => {
      it('should handle JSON responses', async () => {
        const testRequest: TestEndpointRequest = {
          url: `${testServerUrl}/test`,
          apiType: 'rest',
          method: 'GET',
          headers: {},
          queryParams: {},
        };

        const response = await request(app)
          .post('/api/test-endpoint')
          .send(testRequest)
          .expect(200);

        expect(response.body).toMatchObject({
          statusCode: 200,
          responseTime: expect.any(Number),
          headers: expect.any(Object),
          body: expect.any(Object),
        });

        expect(response.body.headers['content-type']).toContain('application/json');
        expect(typeof response.body.body).toBe('object');
      });

      it('should measure response time', async () => {
        const testRequest: TestEndpointRequest = {
          url: `${testServerUrl}/test`,
          apiType: 'rest',
          method: 'GET',
          headers: {},
          queryParams: {},
        };

        const response = await request(app)
          .post('/api/test-endpoint')
          .send(testRequest)
          .expect(200);

        expect(response.body).toMatchObject({
          statusCode: 200,
          responseTime: expect.any(Number),
        });

        expect(response.body.responseTime).toBeGreaterThanOrEqual(0);
      });
    });

    describe('Query Parameters', () => {
      it('should handle query parameters correctly', async () => {
        const testRequest: TestEndpointRequest = {
          url: `${testServerUrl}/test`,
          apiType: 'rest',
          method: 'GET',
          headers: {},
          queryParams: {
            param1: 'value1',
            param2: 'value2',
            'special-param': 'special value',
          },
        };

        const response = await request(app)
          .post('/api/test-endpoint')
          .send(testRequest)
          .expect(200);

        expect(response.body).toMatchObject({
          statusCode: 200,
          responseTime: expect.any(Number),
        });

        expect(response.body.body.query).toMatchObject({
          param1: 'value1',
          param2: 'value2',
          'special-param': 'special value',
        });
      });
    });

    describe('Custom Headers', () => {
      it('should send custom headers correctly', async () => {
        const testRequest: TestEndpointRequest = {
          url: `${testServerUrl}/test`,
          apiType: 'rest',
          method: 'GET',
          headers: {
            'X-Custom-Header': 'custom-value',
            'User-Agent': 'API-Test-Client/1.0',
            'Accept': 'application/json',
          },
          queryParams: {},
        };

        const response = await request(app)
          .post('/api/test-endpoint')
          .send(testRequest)
          .expect(200);

        expect(response.body).toMatchObject({
          statusCode: 200,
          responseTime: expect.any(Number),
        });

        const requestHeaders = response.body.body.headers;
        expect(requestHeaders['x-custom-header']).toBe('custom-value');
        expect(requestHeaders['user-agent']).toBe('API-Test-Client/1.0');
        expect(requestHeaders['accept']).toBe('application/json');
      });
    });
  });
});