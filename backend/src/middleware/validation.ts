// Request validation middleware
import { Request, Response, NextFunction } from 'express';
import { 
  validateApiTestConfig, 
  validateLoadTestConfig, 
  ValidationError as ZodValidationError 
} from '../types/validation';
import { AppError } from './errorHandler';

// Middleware to validate API test configuration
export const validateApiTestRequest = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const validatedConfig = validateApiTestConfig(req.body);
    req.body = validatedConfig; // Replace with validated data
    next();
  } catch (error) {
    if (error instanceof ZodValidationError) {
      const formattedErrors = error.getFormattedErrors();
      return next(new AppError(
        `Validation failed: ${formattedErrors.map(e => e.message).join(', ')}`,
        400
      ));
    }
    next(error);
  }
};

// Middleware to validate load test configuration
export const validateLoadTestRequest = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const validatedConfig = validateLoadTestConfig(req.body);
    req.body = validatedConfig; // Replace with validated data
    next();
  } catch (error) {
    if (error instanceof ZodValidationError) {
      const formattedErrors = error.getFormattedErrors();
      return next(new AppError(
        `Validation failed: ${formattedErrors.map(e => e.message).join(', ')}`,
        400
      ));
    }
    next(error);
  }
};

// Generic validation middleware factory
export const validateSchema = (validator: (data: unknown) => any) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const validatedData = validator(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof ZodValidationError) {
        const formattedErrors = error.getFormattedErrors();
        return next(new AppError(
          `Validation failed: ${formattedErrors.map(e => e.message).join(', ')}`,
          400
        ));
      }
      next(error);
    }
  };
};

// Validate pagination parameters
export const validatePagination = (req: Request, _res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 25;
  const sortBy = req.query.sortBy as string || 'created_at';
  const sortOrder = (req.query.sortOrder as string)?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  // Validate page
  if (page < 1) {
    return next(new AppError('Page must be greater than 0', 400));
  }

  // Validate limit
  if (limit < 1 || limit > 100) {
    return next(new AppError('Limit must be between 1 and 100', 400));
  }

  // Validate sortBy (basic validation - could be enhanced)
  const allowedSortFields = ['created_at', 'updated_at', 'name', 'type', 'status'];
  if (!allowedSortFields.includes(sortBy)) {
    return next(new AppError(`Invalid sort field. Allowed: ${allowedSortFields.join(', ')}`, 400));
  }

  // Add validated pagination to request
  req.pagination = {
    page,
    limit,
    sortBy,
    sortOrder: sortOrder as 'ASC' | 'DESC'
  };

  next();
};

// Validate UUID parameter
export const validateUUID = (paramName: string) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const uuid = req.params[paramName];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuid || !uuidRegex.test(uuid)) {
      return next(new AppError(`Invalid ${paramName} format`, 400));
    }
    
    next();
  };
};

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      pagination?: {
        page: number;
        limit: number;
        sortBy: string;
        sortOrder: 'ASC' | 'DESC';
      };
    }
  }
}