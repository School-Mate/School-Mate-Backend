import { NextFunction, Response } from 'express';
import { HttpException } from '@exceptions/HttpException';
import { logger } from '@utils/logger';
import { RequestWithUser } from '@/interfaces/auth.interface';
import ResponseWrapper from '@/utils/responseWarpper';

const errorMiddleware = (error: HttpException, req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const status: number = error.status || 500;
    const message: string = error.message || 'Something went wrong';

    logger.error(
      `[${req.method}] ${req.path} >> StatusCode:: ${status}, Message:: ${message}, Request ID:: ${req.requestId}, IP:: ${req.ip}, UserAgent:: ${
        req.headers['user-agent']
      } User :: ${req.user ? `${req.user.name} (${req.user.id})` : 'Not Logged In'}`,
    );
    ResponseWrapper(req, res, { message, status });
  } catch (error) {
    next(error);
  }
};

export default errorMiddleware;
