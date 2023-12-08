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
  userSchool?: UserSchool & { school: School };
}

export type Provider = 'kakao' | 'google' | 'id';

export type PushMessageType = 'openstack' | 'openstacks';
export interface PushMessageData {
  type: PushMessageType;
  url: string;
}

export type PushMessage = {
  // {"type": "openstack", "url": "/asked"}
  openstack: string;
  // {"type": "openstacks", "url": ["/asked", "/asked/11b6648f-360e-4c9e-847b-5a2abdb2fb15/6b7781f7-75d6-4a14-ba3a-661453befe9c"]}
  openstacks: [string, string];
  // {"type": "resetstack", "url": "/asked"}
  resetstack: string;
};
