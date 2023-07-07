import { Admin } from '@prisma/client';
import { RequestHandler } from './routes.interface';

export interface RequestWithAdmin extends RequestHandler {
  admin: Admin;
}
