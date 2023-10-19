import { NextFunction, Response } from 'express';
import { verify } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { SECRET_KEY } from '@config';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, RequestWithUser, UserWithSchool } from '@interfaces/auth.interface';
import { excludeUserPassword } from '@/utils/util';

const authMiddleware = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const Authorization = req.cookies['Authorization'] || (req.header('Authorization') ? req.header('Authorization').split('Bearer ')[1] : null);

    if (Authorization) {
      const secretKey: string = SECRET_KEY;
      const verificationResponse = (await verify(Authorization, secretKey)) as DataStoredInToken;
      const userId = verificationResponse.id;

      const users = new PrismaClient().user;
      const findUser = await users.findUnique({
        where: { id: userId },
        include: {
          SocialLogin: true,
          UserSchool: true,
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

export default authMiddleware;
