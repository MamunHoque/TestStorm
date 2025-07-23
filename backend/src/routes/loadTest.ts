import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validateLoadTestRequest, validateUUID } from '../middleware/validation';
import { LoadTestService } from '../services/LoadTestService';
import { TestExecutionRepository } from '../models/TestExecutionRepository';
import { getDatabase } from '../models/database';
import { logger } from '../utils/logger';

const router = Router();
const loadTestService = LoadTestService.getInstance();

// Start load test
router.post('/start', validateLoadTestRequest, asyncHandler(async (req, res) => {
  const config = req.body;
  
  logger.info(`Starting load test: ${config.name}`);
  
  try {
    const { testId, execution } = await loadTestService.startLoadTest(config);
    
    // Save execution to database
    const db = getDatabase();
    const executionRepo = new TestExecutionRepository(db);
    await executionRepo.create(execution);
    
    res.json({
      success: true,
      data: {
        testId,
        execution,
      },
      message: 'Load test started successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Load test start failed:', error);
    res.status(500).json({
      success: false,
      error: 'Load test start failed',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}));

// Stop load test
router.post('/stop/:testId', validateUUID('testId'), asyncHandler(async (req, res) => {
  const { testId } = req.params;
  
  logger.info(`Stopping load test: ${testId}`);
  
  try {
    const stopped = await loadTestService.stopLoadTest(testId);
    
    if (stopped) {
      // Update execution status in database
      const db = getDatabase();
      const executionRepo = new TestExecutionRepository(db);
      await executionRepo.updateStatus(testId, 'stopped');
      
      res.json({
        success: true,
        data: { testId, stopped: true },
        message: 'Load test stopped successfully',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Test not found or already stopped',
        testId,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    logger.error(`Load test stop failed for ${testId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Load test stop failed',
      message: error.message,
      testId,
      timestamp: new Date().toISOString(),
    });
  }
}));

// Get load test status
router.get('/status/:testId', validateUUID('testId'), asyncHandler(async (req, res) => {
  const { testId } = req.params;
  
  try {
    const status = loadTestService.getTestStatus(testId);
    
    // Get execution details from database
    const db = getDatabase();
    const executionRepo = new TestExecutionRepository(db);
    const execution = await executionRepo.findById(testId);
    
    res.json({
      success: true,
      data: {
        testId,
        status,
        execution,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error(`Get test status failed for ${testId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get test status',
      message: error.message,
      testId,
      timestamp: new Date().toISOString(),
    });
  }
}));

// Get running tests
router.get('/running', asyncHandler(async (req, res) => {
  try {
    const runningTestIds = loadTestService.getRunningTests();
    
    // Get execution details for running tests
    const db = getDatabase();
    const executionRepo = new TestExecutionRepository(db);
    
    const runningTests = await Promise.all(
      runningTestIds.map(async (testId) => {
        const execution = await executionRepo.findById(testId);
        return {
          testId,
          execution,
          status: loadTestService.getTestStatus(testId),
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        count: runningTests.length,
        tests: runningTests,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Get running tests failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get running tests',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}));

// Get load test presets
router.get('/presets', asyncHandler(async (req, res) => {
  const presets = [
    {
      name: 'Quick Test',
      description: 'Fast test with low load for quick validation',
      config: {
        load: {
          virtualUsers: 10,
          rampUpTime: 10,
          duration: 60,
        },
        options: {
          keepAlive: true,
          randomizedDelays: false,
          timeout: 30000,
          followRedirects: true,
          validateSSL: true,
        },
      },
    },
    {
      name: 'Baseline Test',
      description: 'Standard test for baseline performance measurement',
      config: {
        load: {
          virtualUsers: 100,
          rampUpTime: 30,
          duration: 300,
        },
        options: {
          keepAlive: true,
          randomizedDelays: false,
          timeout: 30000,
          followRedirects: true,
          validateSSL: true,
        },
      },
    },
    {
      name: 'Stress Test',
      description: 'High load test to find breaking points',
      config: {
        load: {
          virtualUsers: 500,
          rampUpTime: 60,
          duration: 600,
        },
        options: {
          keepAlive: true,
          randomizedDelays: true,
          timeout: 30000,
          followRedirects: true,
          validateSSL: true,
        },
      },
    },
    {
      name: 'Spike Test',
      description: 'Sudden load increase to test system resilience',
      config: {
        load: {
          virtualUsers: 1000,
          rampUpTime: 10,
          duration: 120,
        },
        options: {
          keepAlive: true,
          randomizedDelays: false,
          timeout: 30000,
          followRedirects: true,
          validateSSL: true,
        },
      },
    },
  ];
  
  res.json({
    success: true,
    data: presets,
    timestamp: new Date().toISOString(),
  });
}));

// Validate load test configuration
router.post('/validate', asyncHandler(async (req, res) => {
  try {
    // The validateLoadTestRequest middleware already validates the config
    res.json({
      success: true,
      data: { valid: true },
      message: 'Load test configuration is valid',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Invalid load test configuration',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}));

export { router as loadTestRoutes };