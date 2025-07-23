import { Router } from 'express';
import { apiTestRoutes } from './apiTest';
import { loadTestRoutes } from './loadTest';
import { resultsRoutes } from './results';

const router = Router();

// API versioning
const API_VERSION = '/v1';

// Health check for API
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Route modules
router.use(`${API_VERSION}/api-test`, apiTestRoutes);
router.use(`${API_VERSION}/load-test`, loadTestRoutes);
router.use(`${API_VERSION}/results`, resultsRoutes);

export { router as apiRoutes };