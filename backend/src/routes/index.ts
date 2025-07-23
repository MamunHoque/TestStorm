import { Router } from 'express';
import { apiTestRoutes } from './apiTest';
import { loadTestRoutes } from './loadTest';
import { resultsRoutes } from './results';
import { healthCheck, readinessCheck, livenessCheck } from '../controllers/healthController';
import { validatePagination, validateUUID } from '../middleware/validation';

const router = Router();

// API versioning
const API_VERSION = '/v1';

// Health check endpoints
router.get('/health', healthCheck);
router.get('/health/ready', readinessCheck);
router.get('/health/live', livenessCheck);

// API info endpoint
router.get('/info', (req, res) => {
  res.json({
    name: 'API Load Testing & Monitoring API',
    version: '1.0.0',
    description: 'Professional-grade API for load testing and monitoring',
    endpoints: {
      health: '/api/health',
      apiTest: '/api/v1/api-test',
      loadTest: '/api/v1/load-test',
      results: '/api/v1/results',
    },
    documentation: '/api/docs', // Future: API documentation
    timestamp: new Date().toISOString(),
  });
});

// Route modules with middleware
router.use(`${API_VERSION}/api-test`, apiTestRoutes);
router.use(`${API_VERSION}/load-test`, loadTestRoutes);
router.use(`${API_VERSION}/results`, resultsRoutes);

export { router as apiRoutes };