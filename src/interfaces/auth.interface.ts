import { User } from '@prisma/client';
import { RequestHandler } from './routes.interface';

export interface DataStoredInToken {
  id: string;
}

export interface TokenData {
  token: string;
  expiresIn: number;
}

export interface RequestWithUser extends RequestHandler {
  user: User;
}

export type Provider = 'kakao' | 'google' | 'id';
