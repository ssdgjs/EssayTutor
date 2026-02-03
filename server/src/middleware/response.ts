import { Request, Response, NextFunction } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({
    success: true,
    data,
  } as ApiResponse<T>);
}

export function sendError(
  res: Response,
  message: string,
  code = 'INTERNAL_ERROR',
  statusCode = 500
): void {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  } as ApiResponse);
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
