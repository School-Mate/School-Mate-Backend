import { sign } from 'jsonwebtoken';
import { PrismaClient, SocialLogin, User } from '@prisma/client';
import {
  DOMAIN,
  GOOGLE_CLIENT_KEY,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  KAKAO_CLIENT_KEY,
  KAKAO_CLIENT_SECRET,
  KAKAO_REDIRECT_URI,
  MESSAGE_FROM,
  SECRET_KEY,
  SOL_API_KEY,
  SOL_API_SECRET,
} from '@config';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, TokenData } from '@interfaces/auth.interface';
import { isEmpty } from '@utils/util';
import qs from 'qs';
import axios, { AxiosError } from 'axios';
import bcrypt from 'bcrypt';
import { CreateUserDto } from '@/dtos/users.dto';
import { SolapiMessageService } from 'solapi';

class AuthService {
  public users = new PrismaClient().user;
  public socialLogin = new PrismaClient().socialLogin;
  public verifyPhone = new PrismaClient().verifyPhone;
  public messageService = new SolapiMessageService(SOL_API_KEY, SOL_API_SECRET);

  // public async signup(userData: CreateUserDto): Promise<User> {
  //   if (isEmpty(userData)) throw new HttpException(400, 'userData is empty');

  //   const findUser: User = await this.users.findUnique({ where: { email: userData.email } });
  //   if (findUser) throw new HttpException(409, `This email ${userData.email} already exists`);

  //   const hashedPassword = await hash(userData.password, 10);
  //   const createUserData: Promise<User> = this.users.create({ data: { ...userData, password: hashedPassword } });

  //   return createUserData;
  // }

  // public async signUp(userData: CreateUserDto): Promise<User> {
  //   if (userData.provider === 'id') {
  //     const salt = await bcrypt.genSalt(10);
  //     const hashedPassword = await bcrypt.hash(userData.password, salt);
  //   }

  //   return '' as unknown as User;
  // }

  public async verifyPhoneMessage(phone: string): Promise<string> {
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    const verifyPhone = await this.verifyPhone.create({
      data: {
        phone,
        code,
      },
    });

    this.messageService.sendOne({
      to: phone,
      from: MESSAGE_FROM,
      text: `[SchoolMate]인증번호는 ${code}입니다.`,
    });

    return verifyPhone.id;
  }

  public async verifyPhoneCode(phone: string, code: string, token: string): Promise<boolean> {
    const verifyPhone = await this.verifyPhone.findUnique({
      where: {
        id: token,
      },
    });

    if (!verifyPhone) return false;

    if (verifyPhone.phone !== phone) return false;

    if (verifyPhone.code !== code) return false;

    return true;
  }

  public async kakaoLogin(code: string): Promise<{ cookie: string; findUser: User; redirect?: string }> {
    const query = qs.stringify({
      grant_type: 'authorization_code',
      client_id: KAKAO_CLIENT_KEY,
      redirect_uri: KAKAO_REDIRECT_URI,
      code,
      client_secret: KAKAO_CLIENT_SECRET,
    });

    try {
      const { data } = await axios.post('https://kauth.kakao.com/oauth/token', query, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
      });

      const { data: userData } = await axios.post(
        'https://kapi.kakao.com/v2/user/me',
        {
          property_keys: ['kakao_account', 'profile'],
        },
        {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        },
      );

      const socialLogin = await this.socialLogin.findUnique({
        where: {
          socialId: userData.id.toString(),
        },
      });

      if (!socialLogin) {
        const createUserData: User = await this.users.create({
          data: {
            email: userData.kakao_account.email as string,
            name: userData.kakao_account.profile.nickname as string,
            provider: 'social',
            SocialLogin: {
              create: {
                provider: 'kakao',
                socialId: userData.id.toString(),
                accessToken: data.access_token as string,
              },
            },
          },
        });
        const tokenData = this.createToken(createUserData);
        const cookie = this.createCookie(tokenData);
        return { cookie, findUser: createUserData, redirect: '/signup/social' };
      } else {
        const findUser = await this.users.update({
          where: {
            id: socialLogin.userId,
          },
          data: {
            email: userData.kakao_account.email as string,
            name: userData.kakao_account.profile.nickname as string,
          },
        });
        const tokenData = this.createToken(findUser);
        const cookie = this.createCookie(tokenData);
        return { cookie, findUser };
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new HttpException(400, error.response.data.msg);
      }
      throw new HttpException(400, error);
    }
  }

  public async googleLogin(code: string): Promise<{ cookie: string; findUser: User; redirect?: string }> {
    const query = qs.stringify({
      code,
      client_id: GOOGLE_CLIENT_KEY,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    try {
      const { data } = await axios.post('https://oauth2.googleapis.com/token', query, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { data: userData } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });

      const socialLogin = await this.socialLogin.findUnique({
        where: {
          socialId: userData.id as string,
        },
      });

      if (!socialLogin) {
        const createUserData: User = await this.users.create({
          data: {
            email: userData.email as string,
            name: userData.name as string,
            provider: 'social',
            SocialLogin: {
              create: {
                provider: 'google',
                socialId: userData.id as string,
                accessToken: data.access_token as string,
              },
            },
          },
        });
        const tokenData = this.createToken(createUserData);
        const cookie = this.createCookie(tokenData);
        return { cookie, findUser: createUserData, redirect: '/signup/social' };
      } else {
        const findUser = await this.users.findUnique({
          where: {
            id: socialLogin.userId,
          },
        });
        const tokenData = this.createToken(findUser);
        const cookie = this.createCookie(tokenData);
        return { cookie, findUser };
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new HttpException(400, error.response.data.message);
      }
      throw new HttpException(400, error);
    }
  }

  // public async login(userData: CreateUserDto): Promise<{ cookie: string; findUser: User }> {
  //   if (isEmpty(userData)) throw new HttpException(400, 'userData is empty');

  //   const findUser: User = await this.users.findUnique({ where: { email: userData.email } });
  //   if (!findUser) throw new HttpException(409, `This email ${userData.email} was not found`);

  //   const isPasswordMatching: boolean = await compare(userData.password, findUser.password);
  //   if (!isPasswordMatching) throw new HttpException(409, 'Password is not matching');

  //   const tokenData = this.createToken(findUser);
  //   const cookie = this.createCookie(tokenData);

  //   return { cookie, findUser };
  // }

  public async logout(userData: User): Promise<User> {
    if (isEmpty(userData)) throw new HttpException(400, 'userData is empty');

    const findUser: User = await this.users.findFirst({ where: { email: userData.email, password: userData.password } });
    if (!findUser) throw new HttpException(409, "User doesn't exist");

    return findUser;
  }

  public createToken(user: User): TokenData {
    const dataStoredInToken: DataStoredInToken = { id: user.id };
    const secretKey: string = SECRET_KEY;
    const expiresIn: number = 60 * 60;

    return { expiresIn, token: sign(dataStoredInToken, secretKey, { expiresIn }) };
  }

  public createCookie(tokenData: TokenData): string {
    return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn}; Domain=${DOMAIN}; Path=/`;
  }
}

export default AuthService;
