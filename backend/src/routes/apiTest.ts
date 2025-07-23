import { Router, Request, Response } from 'express';
import { HttpClientService } from '../services/httpClient';
import { TestEndpointRequest, TestEndpointResponse } from '../models/ApiTest';

const router = Router();
const httpClient = new HttpClientService();

/**
 * POST /api/test-endpoint
 * Execute a single API test request
 */
router.post('/test-endpoint', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    // Extract request data
    const testRequest: TestEndpointRequest = {
      url: req.body.url,
      apiType: req.body.apiType || 'rest',
      method: req.body.method,
      headers: req.body.headers || {},
      queryParams: req.body.queryParams || {},
      body: req.body.body,
      graphql: req.body.graphql,
      auth: req.body.auth,
    };

    // Log the incoming request
    console.log(`[API Test] ${testRequest.method} ${testRequest.url}`);
    console.log(`[API Test] Headers:`, Object.keys(testRequest.headers).length);
    console.log(`[API Test] Query Params:`, Object.keys(testRequest.queryParams).length);
    console.log(`[API Test] Has Body:`, !!testRequest.body);
    console.log(`[API Test] Auth Type:`, testRequest.auth?.type || 'none');

    // Validate the request
    const validation = httpClient.validateRequest(testRequest);
    if (!validation.isValid) {
      console.log(`[API Test] Validation failed:`, validation.errors);
      return res.status(400).json({
        error: 'Invalid request',
        details: validation.errors,
        statusCode: 400,
        responseTime: Date.now() - startTime,
        headers: {},
        body: null,
      });
    }

    // Execute the request
    const result: TestEndpointResponse = await httpClient.executeRequest(testRequest);
    
    // Log the result
    console.log(`[API Test] Result: ${result.statusCode} (${result.responseTime}ms)`);
    if (result.error) {
      console.log(`[API Test] Error: ${result.error}`);
    }

    // Return the result
    res.status(200).json(result);

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('[API Test] Unexpected error:', error);

    // Handle unexpected errors
    const errorResponse: TestEndpointResponse = {
      statusCode: 500,
      responseTime,
      headers: {},
      body: null,
      error: error instanceof Error ? error.message : 'Internal server error',
    };

    res.status(500).json(errorResponse);
  }
});

/**
 * GET /api/test-endpoint/health
 * Health check for the API test service
 */
router.get('/test-endpoint/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    service: 'API Test Endpoint',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;