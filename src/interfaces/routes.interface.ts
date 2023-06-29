import { Request, Router } from 'express';

export interface Routes {
  path?: string;
  router: Router;
}

export interface RequestHandler extends Request {
  requestId: string;
}
