import { NextFunction, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { DOMAIN, SECRET_KEY } from '@config';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, RequestWithUser, UserWithSchool } from '@interfaces/auth.interface';
import { excludeUserPassword } from '@/utils/util';
import Container from 'typedi';
import { PrismaClientService } from '@/services/prisma.service';

const authMiddleware = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const Authorization = req.cookies['Authorization'] || (req.header('Authorization') ? req.header('Authorization').split('Bearer ')[1] : null);

    if (Authorization) {
      const secretKey: string = SECRET_KEY;
      const verificationResponse = (await verify(Authorization, secretKey)) as DataStoredInToken;
      const userId = verificationResponse.id;

      const users = Container.get(PrismaClientService).user;
      const findUser = await users.findUnique({
        where: { id: userId },
        include: {
          socialLogin: true,
          userSchool: {
            include: {
              school: true,
            },
          },
        },
      });

      if (findUser) {
        const excludedUserPassword = excludeUserPassword(findUser, ['password']);
        req.user = excludedUserPassword as unknown as UserWithSchool;
        next();
      } else {
        next(new HttpException(401, '올바르지 않은 인증 토큰입니다.'));
      }
    } else {
      next(new HttpException(401, '로그인 후 이용해주세요.'));
    }
  } catch (error) {
    next(new HttpException(401, '올바르지 않은 인증 토큰입니다.'));
  }
};

export const authVerifyMiddleware = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  if (req.user.userSchool.verified) {
    next();
  } else {
    next(new HttpException(401, '학교 인증 후 이용해주세요. (홈 -> 우츨 상단 프로필 > 학교 인증)'));
  }
};

export const authQueryMiddleware = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const Authorization =
      (req.query.token as string) ||
      req.cookies['Authorization'] ||
      (req.header('Authorization') ? req.header('Authorization').split('Bearer ')[1] : null);

    if (Authorization) {
      const secretKey: string = SECRET_KEY;
      const verificationResponse = (await verify(Authorization, secretKey)) as DataStoredInToken;
      const userId = verificationResponse.id;

      const users = Container.get(PrismaClientService).user;
      const findUser = await users.findUnique({
        where: { id: userId },
        include: {
          socialLogin: true,
          userSchool: {
            include: {
              school: true,
            },
          },
        },
      });

      if (findUser) {
        res.setHeader('Set-Cookie', [`Authorization=${Authorization}; Path=/; HttpOnly; Domain=${DOMAIN}; Max-Age=${60 * 60 * 24 * 1};`]);
        const excludedUserPassword = excludeUserPassword(findUser, ['password']);
        req.user = excludedUserPassword as unknown as UserWithSchool;
        next();
      } else {
        next(new HttpException(401, '올바르지 않은 인증 토큰입니다.'));
      }
    } else {
      next(new HttpException(401, '로그인 후 이용해주세요.'));
    }
  } catch (error) {
    next(new HttpException(401, '올바르지 않은 인증 토큰입니다.'));
  }
};

export default authMiddleware;
