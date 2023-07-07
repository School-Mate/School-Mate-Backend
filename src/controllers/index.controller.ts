import { RequestHandler } from '@/interfaces/routes.interface';
import ResponseWrapper from '@/utils/responseWarpper';
import { NextFunction, Response } from 'express';

class IndexController {
  public index = (req: RequestHandler, res: Response, next: NextFunction): void => {
    try {
      ResponseWrapper(req, res, {});
    } catch (error) {
      next(error);
    }
  };
}

export default IndexController;
