import { School, User, UserSchool } from '@prisma/client';
import { RequestHandler } from './routes.interface';

export interface DataStoredInToken {
  id: string;
}

export interface TokenData {
  token: string;
  expiresIn: number;
}

export interface RequestWithUser extends RequestHandler {
  user: UserWithSchool;
}

export interface UserWithSchool extends User {
  UserSchool?: UserSchool & { school: School };
}

export type Provider = 'kakao' | 'google' | 'id';
