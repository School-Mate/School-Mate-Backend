import { sign } from 'jsonwebtoken';
import { PrismaClient, User } from '@prisma/client';
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
import { DataStoredInToken, RequestWithUser, TokenData } from '@interfaces/auth.interface';
import { isEmpty } from '@utils/util';
import qs from 'qs';
import axios, { AxiosError } from 'axios';
import { SolapiMessageService } from 'solapi';
import { CreateUserDto } from '@/dtos/users.dto';
import bcrypt from 'bcrypt';

class AuthService {
  public users = new PrismaClient().user;
  public socialLogin = new PrismaClient().socialLogin;
  public image = new PrismaClient().image;
  public verifyPhone = new PrismaClient().verifyPhone;
  public messageService = new SolapiMessageService(SOL_API_KEY, SOL_API_SECRET);

  public async uploadImage(req: RequestWithUser): Promise<string> {
    if (!req.file) throw new HttpException(500, '사진 업로드를 실패했습니다');

    const file = req.file as Express.MulterS3.File;
    const schoolImage = await this.image.create({
      data: {
        key: file.key,
        userId: req.user.id,
      },
    });

    return schoolImage.id;
  }

  public async signUp(userData: CreateUserDto): Promise<User> {
    const findPhone = await this.verifyPhone.findUnique({
      where: {
        id: userData.token,
      },
    });
    if (findPhone.code !== userData.code) throw new HttpException(400, '인증번호가 일치하지 않습니다.');

    const findUser = await this.users.findUnique({
      where: {
        phone: userData.phone,
      },
    });
    if (findUser) throw new HttpException(409, '이미 가입된 전화번호입니다.');

    if (userData.provider === 'id') {
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const createUserData = await this.users.create({
        data: {
          phone: userData.phone,
          name: userData.name,
          email: userData.email,
          provider: 'id',
          password: hashedPassword,
          verified: true,
          Agreement: {
            create: {
              receive: userData.marketingAgree,
            },
          },
        },
        select: {
          password: false,
        },
      });

      return createUserData as User;
    }

    const findSocialUser = await this.socialLogin.findUnique({
      where: {
        socialId: userData.socialId,
      },
      select: {
        user: true,
      },
    });

    if (findSocialUser) throw new HttpException(409, '이미 가입된 소셜 아이디가 있습니다.');

    const updateUser = await this.users.update({
      where: {
        id: findSocialUser.user.id,
      },
      data: {
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        verified: true,
        Agreement: {
          upsert: {
            create: {
              receive: userData.marketingAgree,
            },
            update: {
              receive: userData.marketingAgree,
            },
          },
        },
      },
      select: {
        password: false,
      },
    });

    return updateUser as User;
  }

  public async verifyPhoneMessage(phone: string): Promise<string> {
    const findUser = await this.users.findUnique({
      where: {
        phone: phone,
      },
    });
    if (findUser) throw new HttpException(409, '이미 가입된 전화번호입니다.');

    const code = Math.floor(1000 + Math.random() * 9000).toString();

    const verifyPhone = await this.verifyPhone.create({
      data: {
        phone,
        code,
      },
    });

    try {
      await this.messageService.sendOne({
        to: phone,
        from: MESSAGE_FROM,
        text: `[SchoolMate] 인증번호는 ${code}입니다.`,
      });
    } catch (error) {
      throw new HttpException(400, '메시지 전송에 실패했습니다.');
    }

    return verifyPhone.id;
  }

  public async verifyPhoneCode(phone: string, code: string, token: string): Promise<boolean> {
    const verifyPhone = await this.verifyPhone.findUnique({
      where: {
        id: token,
      },
    });

    if (!verifyPhone) throw new HttpException(400, '인증번호가 만료되었습니다.');

    if (verifyPhone.phone !== phone) throw new HttpException(400, '인증번호가 일치하지 않습니다.');

    if (verifyPhone.code !== code) throw new HttpException(400, '인증번호가 일치하지 않습니다.');

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
