import { DOMAIN, SECRET_KEY } from '@/config';
import { AdminDto } from '@/dtos/admin.dto';
import { HttpException } from '@/exceptions/HttpException';
import { DataStoredInToken, TokenData } from '@/interfaces/auth.interface';
import { deleteObject } from '@/utils/multer';
import { excludeAdminPassword, isEmpty } from '@/utils/util';
import { Admin, PrismaClient, Process, UserSchoolVerify } from '@prisma/client';
import bcrypt from 'bcrypt';
import { sign } from 'jsonwebtoken';
import SchoolService from './school.service';

class AdminService {
  public admin = new PrismaClient().admin;
  public image = new PrismaClient().image;
  public userSchoolVerify = new PrismaClient().userSchoolVerify;
  public userSchool = new PrismaClient().userSchool;
  public schoolService = new SchoolService();

  public async signUp(adminData: AdminDto): Promise<Admin> {
    const findAdmin: Admin = await this.admin.findUnique({ where: { loginId: adminData.id } });
    if (findAdmin) throw new HttpException(409, `이미 존재하는 아이디입니다.`);

    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    const createAdminData = await this.admin.create({
      data: {
        loginId: adminData.id,
        password: hashedPassword,
        flags: 2 << 0,
      },
    });

    const removePasswordData = excludeAdminPassword(createAdminData, ['password']);

    return removePasswordData as Admin;
  }

  public async login(adminData: AdminDto): Promise<{ cookie: string; findAdmin: Admin }> {
    const findAdmin = await this.admin.findUnique({
      where: {
        loginId: adminData.id,
      },
    });

    if (!findAdmin) throw new HttpException(409, '가입되지 않은 어드민입니다.');

    const isPasswordMatching: boolean = await bcrypt.compare(adminData.password, findAdmin.password);
    if (!isPasswordMatching) throw new HttpException(409, '비밀번호가 일치하지 않습니다.');

    const removePasswordData = excludeAdminPassword(findAdmin, ['password']);

    const tokenData = this.createToken(findAdmin);
    const cookie = this.createCookie(tokenData);

    return {
      cookie,
      findAdmin: removePasswordData as Admin,
    };
  }

  public async logout(adminData: Admin): Promise<Admin> {
    if (isEmpty(adminData)) throw new HttpException(400, 'adminData is empty');

    const findAdmin: Admin = await this.admin.findFirst({ where: { id: adminData.id } });
    if (!findAdmin) throw new HttpException(409, "User doesn't exist");

    return findAdmin;
  }

  public deleteImage = async (imageId: string): Promise<boolean> => {
    const findImage = await this.image.findUnique({ where: { id: imageId } });
    if (!findImage) throw new HttpException(409, '이미지를 찾을 수 없습니다.');

    const deleteImage = await this.image.delete({ where: { id: imageId } });

    try {
      await deleteObject(deleteImage.key);
    } catch (error) {
      throw error;
    }

    return true;
  };

  public verifyRequests = async (): Promise<Array<UserSchoolVerify>> => {
    const requests = await this.userSchoolVerify.findMany({
      where: {
        process: Process.pending,
      },
    });
    return requests;
  };

  public postVerifyRequest = async (userId: string, message: string, process: string): Promise<void> => {
    const findUser = await this.userSchoolVerify.findFirst({ where: { userId: userId } });
    if (!findUser) throw new HttpException(409, '해당 유저의 신청을 찾을 수 없습니다.');

    const updateRequest = await this.userSchoolVerify.update({
      where: { id: findUser.id },
      data: {
        message: message,
        process: Process.success === process ? Process.success : Process.deny,
      },
    });

    if (updateRequest.process === Process.success) {
      const schoolInfo = await this.schoolService.getSchoolById(updateRequest.schoolId);

      await this.userSchool.create({
        data: {
          userId: updateRequest.userId,
          schoolId: updateRequest.schoolId,
          dept: schoolInfo.code,
          class: updateRequest.class,
          grade: updateRequest.grade,
        },
      });
    }
  };

  public createToken(admin: Admin): TokenData {
    const dataStoredInToken: DataStoredInToken = { id: admin.id };
    const secretKey: string = SECRET_KEY;
    const expiresIn: number = 60 * 60;

    return { expiresIn, token: sign(dataStoredInToken, secretKey, { expiresIn }) };
  }

  public createCookie(tokenData: TokenData): string {
    return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn}; Domain=${DOMAIN}; Path=/`;
  }
}

export default AdminService;
