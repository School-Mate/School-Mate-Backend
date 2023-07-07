import { DOMAIN, SECRET_KEY } from '@/config';
import { AdminDto } from '@/dtos/admin.dto';
import { HttpException } from '@/exceptions/HttpException';
import { DataStoredInToken, TokenData } from '@/interfaces/auth.interface';
import { excludeAdminPassword } from '@/utils/util';
import { Admin, PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { sign } from 'jsonwebtoken';

class AdminService {
  public admin = new PrismaClient().admin;

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
