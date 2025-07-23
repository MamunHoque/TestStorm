// Health check controller
import { Request, Response } from 'express';
import { getDatabase } from '../models/database';
import { logger } from '../utils/logger';

export const healthCheck = async (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const dbHealthy = await db.healthCheck();
    const dbInfo = await db.getInfo();

    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: {
        healthy: dbHealthy,
        path: dbInfo.path,
        tables: dbInfo.tables.length,
        version: dbInfo.version?.version,
      },
      services: {
        api: 'healthy',
        websocket: 'healthy',
        database: dbHealthy ? 'healthy' : 'unhealthy',
      }
    };

    const statusCode = dbHealthy ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      services: {
        api: 'healthy',
        websocket: 'unknown',
        database: 'unhealthy',
      }
    });
  }
};

export const readinessCheck = async (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const dbHealthy = await db.healthCheck();

    if (!dbHealthy) {
      return res.status(503).json({
        status: 'NOT_READY',
        message: 'Database not ready',
        timestamp: new Date().toISOString(),
      });
    }

    return res.json({
      status: 'READY',
      timestamp: new Date().toISOString(),
      message: 'Service is ready to accept requests',
    });
  } catch (error) {
    logger.error('Readiness check failed:', error);
    return res.status(503).json({
      status: 'NOT_READY',
      message: 'Service not ready',
      timestamp: new Date().toISOString(),
    });
  }
};

export const livenessCheck = (_req: Request, res: Response) => {
  res.json({
    status: 'ALIVE',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};