import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validateApiTestRequest } from '../middleware/validation';
import { ApiTestService } from '../services/ApiTestService';
import { logger } from '../utils/logger';

const router = Router();
const apiTestService = ApiTestService.getInstance();

// Single API endpoint test
router.post('/execute', validateApiTestRequest, asyncHandler(async (req: Request, res: Response) => {
  const config = req.body;
  
  logger.info(`Executing API test: ${config.method} ${config.url}`);
  
  try {
    const result = await apiTestService.executeTest(config);
    
    res.json({
      success: true,
      data: result,
      message: 'API test executed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('API test execution failed:', error);
    res.status(500).json({
      success: false,
      error: 'API test execution failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}));

// Validate API endpoint accessibility
router.post('/validate', asyncHandler(async (req: Request, res: Response) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'URL is required',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const validation = await apiTestService.validateUrl(url);

    return res.json({
      success: true,
      data: validation,
      message: validation.valid ? 'URL is accessible' : 'URL validation failed',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('URL validation failed:', error);
    return res.status(500).json({
      success: false,
      error: 'URL validation failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}));

// Test connection to endpoint
router.post('/test-connection', asyncHandler(async (req: Request, res: Response) => {
  const { url, timeout = 30000, validateSSL = true } = req.body;
  
  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'URL is required',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const connectionTest = await apiTestService.testConnection({
      url,
      timeout,
      validateSSL,
    });

    return res.json({
      success: true,
      data: connectionTest,
      message: connectionTest.success ? 'Connection successful' : 'Connection failed',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Connection test failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Connection test failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}));

// Get supported HTTP methods
router.get('/methods', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
      authTypes: [
        { value: 'none', label: 'No Authentication' },
        { value: 'bearer', label: 'Bearer Token' },
        { value: 'apikey', label: 'API Key' },
        { value: 'basic', label: 'Basic Authentication' },
      ],
    },
    message: 'Supported methods and authentication types',
    timestamp: new Date().toISOString(),
  });
});

export { router as apiTestRoutes };