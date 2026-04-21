import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации',
        errors: result.error.flatten().fieldErrors,
      });
    }
    (req as Request & { validated: T }).validated = result.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Ошибка валидации параметров',
        errors: result.error.flatten().fieldErrors,
      });
    }
    (req as Request & { validatedQuery: T }).validatedQuery = result.data;
    next();
  };
}
