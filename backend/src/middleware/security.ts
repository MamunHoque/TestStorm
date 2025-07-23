// Security middleware
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';

// Rate limiting (simple in-memory implementation)
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

// Rate limiting middleware
export const rateLimit = (options: {
  windowMs: number;
  max: number;
  message?: string;
}) => {
  const { windowMs, max, message = 'Too many requests' } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    
    // Clean up expired entries
    if (rateLimitStore[key] && now > rateLimitStore[key].resetTime) {
      delete rateLimitStore[key];
    }

    // Initialize or increment counter
    if (!rateLimitStore[key]) {
      rateLimitStore[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
    } else {
      rateLimitStore[key].count++;
    }

    const { count, resetTime } = rateLimitStore[key];

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': max.toString(),
      'X-RateLimit-Remaining': Math.max(0, max - count).toString(),
      'X-RateLimit-Reset': new Date(resetTime).toISOString(),
    });

    if (count > max) {
      logger.warn(`Rate limit exceeded for IP: ${key}`);
      return next(new AppError(message, 429));
    }

    next();
  };
};

// Request size limiter
export const requestSizeLimit = (maxSize: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    
    if (contentLength > maxSize) {
      return next(new AppError(`Request too large. Maximum size: ${maxSize} bytes`, 413));
    }
    
    next();
  };
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  });

  next();
};

// API key validation (for future use)
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.get('X-API-Key') || req.get('Authorization')?.replace('Bearer ', '');
  
  if (!apiKey) {
    return next(new AppError('API key required', 401));
  }

  // TODO: Implement actual API key validation
  // For now, accept any non-empty key
  if (apiKey.length < 10) {
    return next(new AppError('Invalid API key format', 401));
  }

  next();
};

// CORS preflight handler
export const handleCorsPreflightOptions = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'OPTIONS') {
    res.set({
      'Access-Control-Allow-Origin': req.get('Origin') || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Max-Age': '86400', // 24 hours
    });
    return res.status(204).end();
  }
  next();
};

// Input sanitization
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Basic XSS protection - remove script tags and dangerous attributes
  const sanitizeString = (str: string): string => {
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    } else if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    } else if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

// Request logging for security monitoring
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration,
      contentLength: req.get('content-length'),
    };

    // Log suspicious activity
    if (res.statusCode >= 400) {
      logger.warn('Suspicious request:', logData);
    } else {
      logger.info('Request processed:', logData);
    }
  });

  next();
};