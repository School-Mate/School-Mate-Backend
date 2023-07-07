import { SECRET_KEY } from '@/config';
import { HttpException } from '@/exceptions/HttpException';
import { RequestWithAdmin } from '@/interfaces/admin.interface';
import { DataStoredInToken } from '@/interfaces/auth.interface';
import { excludeUserPassword } from '@/utils/util';
import { Admin, PrismaClient } from '@prisma/client';
import { Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';

const adminMiddleware = async (req: RequestWithAdmin, res: Response, next: NextFunction) => {
  try {
    const Authorization = req.cookies['Authorization'] || (req.header('Authorization') ? req.header('Authorization').split('Bearer ')[1] : null);

    if (Authorization) {
      const secretKey: string = SECRET_KEY;
      const verificationResponse = (await verify(Authorization, secretKey)) as DataStoredInToken;
      const adminId = verificationResponse.id;

      const admins = new PrismaClient().admin;
      const findAdmin = await admins.findUnique({
        where: { id: adminId },
      });

      if (findAdmin) {
        const adminWithoutPassword = excludeUserPassword(findAdmin, ['password']);
        req.admin = adminWithoutPassword as unknown as Admin;
        next();
      } else {
        next(new HttpException(401, '올바르지 않은 인증 토큰입니다.'));
      }
    } else {
      next(new HttpException(404, '로그인 후 이용해주세요.'));
    }
  } catch (error) {
    next(new HttpException(401, '올바르지 않은 인증 토큰입니다.'));
  }
};

export default adminMiddleware;
