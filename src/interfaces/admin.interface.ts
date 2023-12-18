import { Admin } from '@prisma/client';
import { RequestHandler } from './routes.interface';

export interface RequestWithAdmin extends RequestHandler {
  admin: Admin;
}

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

export type SmsEvent = {
  // 인증번호 전송
  VERIFY_MESSAGE: {
    '#{인증번호}': string;
  };
  VERIFY_SCHOOL_APPROVE: {
    '#{학교이름}': string;
    '#{학년}': string;
    '#{접속링크}': string;
  };
  VERIFY_SCHOOL_REJECT: {
    '#{학교이름}': string;
    '#{학년}': string;
    '#{사유}': string;
    // schoolmate.kr/verfiy로 넣어서 요청
    '#{접속링크}': string;
  };
};

export enum SMS_TEMPLATE_ID {
  VERIFY_MESSAGE = 'KA01TP231214004440910C51aklhX1LW',
  VERIFY_SCHOOL_APPROVE = 'KA01TP231215192423127nM0HrXrwLTM',
  VERIFY_SCHOOL_REJECT = 'KA01TP231218082231400xxXcvPcLK0x',
}
