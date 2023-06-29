import { NextFunction, Response } from 'express';
import { HttpException } from '@exceptions/HttpException';
import { RequestHandler } from '@/interfaces/routes.interface';
import { v4 as uuidv4 } from 'uuid';

const loggerMiddleware = async (req: RequestHandler, res: Response, next: NextFunction) => {
  try {
    const requestId = uuidv4();
    req.requestId = requestId;
    next();
  } catch (error) {
    next(new HttpException(500, '서버에 오류가 발생했습니다'));
  }
};

export default loggerMiddleware;
