import { Response } from 'express';

import { RequestHandler } from '@/interfaces/routes.interface';

const ResponseWrapper = (req: RequestHandler, res: Response, { data = null, message = null, status = 200 }) => {
  return res.status(status).json({
    status,
    message: message ? message : '요청을 성공적으로 실행했습니다.',
    data,
    path: req.path,
    requestId: req.requestId,
  });
};

export default ResponseWrapper;
