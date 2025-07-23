// WebSocket management routes
import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { getWebSocketService } from '../services/WebSocketService';
import { logger } from '../utils/logger';

const router = Router();

// Get WebSocket connection statistics
router.get('/stats', asyncHandler(async (req, res) => {
  try {
    const wsService = getWebSocketService();
    const stats = wsService.getConnectionStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Failed to get WebSocket stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get WebSocket statistics',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}));

// Send test metrics update (for testing purposes)
router.post('/test-metrics', asyncHandler(async (req, res) => {
  try {
    const wsService = getWebSocketService();
    const { testId, metrics } = req.body;
    
    if (!testId || !metrics) {
      return res.status(400).json({
        success: false,
        error: 'testId and metrics are required',
        timestamp: new Date().toISOString(),
      });
    }

    wsService.broadcastMetricsUpdate({
      testId,
      timestamp: new Date(),
      ...metrics,
    });
    
    res.json({
      success: true,
      message: 'Metrics update broadcasted',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Failed to broadcast test metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to broadcast metrics',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}));

// Send test status update (for testing purposes)
router.post('/test-status', asyncHandler(async (req, res) => {
  try {
    const wsService = getWebSocketService();
    const { testId, status, message, error } = req.body;
    
    if (!testId || !status) {
      return res.status(400).json({
        success: false,
        error: 'testId and status are required',
        timestamp: new Date().toISOString(),
      });
    }

    wsService.broadcastStatusUpdate({
      testId,
      status,
      message,
      error,
      timestamp: new Date(),
    });
    
    res.json({
      success: true,
      message: 'Status update broadcasted',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Failed to broadcast test status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to broadcast status',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}));

// Send log entry (for testing purposes)
router.post('/test-log', asyncHandler(async (req, res) => {
  try {
    const wsService = getWebSocketService();
    const { testId, level, message, method, url, statusCode, responseTime, userId } = req.body;
    
    if (!testId || !level || !message) {
      return res.status(400).json({
        success: false,
        error: 'testId, level, and message are required',
        timestamp: new Date().toISOString(),
      });
    }

    wsService.broadcastLogEntry({
      testId,
      timestamp: new Date(),
      level,
      message,
      method,
      url,
      statusCode,
      responseTime,
      userId,
    });
    
    res.json({
      success: true,
      message: 'Log entry broadcasted',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Failed to broadcast log entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to broadcast log',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}));

// Broadcast message to all clients
router.post('/broadcast', asyncHandler(async (req, res) => {
  try {
    const wsService = getWebSocketService();
    const { event, data } = req.body;
    
    if (!event || !data) {
      return res.status(400).json({
        success: false,
        error: 'event and data are required',
        timestamp: new Date().toISOString(),
      });
    }

    wsService.broadcastToAll(event, {
      ...data,
      timestamp: new Date().toISOString(),
    });
    
    res.json({
      success: true,
      message: 'Message broadcasted to all clients',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Failed to broadcast message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to broadcast message',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}));

export { router as websocketRoutes };