import { sign, verify } from 'jsonwebtoken';
import qs from 'qs';
import axios, { AxiosError } from 'axios';
import { SolapiMessageService } from 'solapi';
import bcrypt from 'bcrypt';

import { Image, PrismaClient, School, User, UserSchool, UserSchoolVerify } from '@prisma/client';
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
import { DataStoredInToken, TokenData, UserWithSchool } from '@interfaces/auth.interface';
import { excludeUserPassword } from '@utils/util';
import { CreateUserDto, LoginUserDto, VerifyPhoneCodeDto } from '@/dtos/users.dto';
import { SchoolService } from './school.service';
import { deleteImage } from '@/utils/multer';
import { AdminService } from './admin.service';
import Container, { Service } from 'typedi';

@Service()
export class AuthService {
  public messageService = new SolapiMessageService(SOL_API_KEY, SOL_API_SECRET);
  public schoolService = Container.get(SchoolService);
  public adminService = Container.get(AdminService);

  public image = new PrismaClient().image;
  public socialLogin = new PrismaClient().socialLogin;
  public users = new PrismaClient().user;
  public phoneVerifyRequest = new PrismaClient().phoneVerifyRequest;
  public schoolVerify = new PrismaClient().userSchoolVerify;
  public pushDevice = new PrismaClient().pushDevice;

  public async meSchool(userData: User): Promise<
    UserSchool & {
      school: School;
    }
  > {
    const findUser = await this.users.findUnique({
      where: {
        id: userData.id,
      },
      include: {
        userSchool: true,
      },
    });
    if (!findUser.userSchoolId) throw new HttpException(400, '학교 인증을 마치지 않았습니다.');

    const findSchool = await this.schoolService.getSchoolInfoById(findUser.userSchool.schoolId);

    return {
      ...findUser.userSchool,
      school: findSchool,
    };
  }

  public async kakaoLogin(code: string): Promise<{
    cookie: string;
    findUser: User & {
      userSchool: UserSchool & {
        school: School;
      };
    };
    token: {
      accessToken: string;
      expiresIn: number;
    };
    registered: boolean;
  }> {
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
            socialLogin: {
              create: {
                provider: 'kakao',
                socialId: userData.id.toString(),
                accessToken: data.access_token as string,
              },
            },
          },
          include: {
            userSchool: true,
            socialLogin: true,
          },
        });
        const loginData = await this.initializeLoginData(createUserData, false);
        return loginData;
      } else {
        const findUser = await this.users.update({
          where: {
            id: socialLogin.userId,
          },
          data: {
            email: userData.kakao_account.email as string,
          },
          include: {
            userSchool: true,
            socialLogin: true,
          },
        });
        const loginData = await this.initializeLoginData(findUser, true);
        return loginData;
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new HttpException(400, error.response.data.msg);
      }
      throw new HttpException(400, error);
    }
  }

  public async meSchoolVerify(userData: User): Promise<UserSchoolVerify[]> {
    const schoolverifyList = await this.schoolVerify.findMany({
      where: {
        userId: userData.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return schoolverifyList;
  }

  public async googleLogin(code: string): Promise<{
    cookie: string;
    findUser: User & {
      userSchool: UserSchool & {
        school: School;
      };
    };
    token: {
      accessToken: string;
      expiresIn: number;
    };
    registered: boolean;
  }> {
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
            socialLogin: {
              create: {
                provider: 'google',
                socialId: userData.id as string,
                accessToken: data.access_token as string,
              },
            },
          },
          include: {
            userSchool: true,
            socialLogin: true,
          },
        });

        const loginData = await this.initializeLoginData(createUserData, false);
        return loginData;
      } else {
        const findUser = await this.users.findUnique({
          where: {
            id: socialLogin.userId,
          },
          include: {
            userSchool: true,
            socialLogin: true,
          },
        });
        const loginData = await this.initializeLoginData(findUser, true);
        return loginData;
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new HttpException(400, error.response.data.message);
      }
      throw new HttpException(400, error);
    }
  }

  public async uploadImage(user: User, file?: Express.MulterS3.File): Promise<string> {
    if (!file) throw new HttpException(500, '사진 업로드를 실패했습니다.');

    const createImage = await this.image.create({
      data: {
        key: file.key,
        userId: user.id,
      },
    });

    return createImage.id;
  }

  private async initializeLoginData(
    user: User & {
      userSchool?: UserSchool & {
        school?: School;
      };
    },
    registered: boolean,
  ): Promise<{
    cookie: string;
    findUser: User & {
      userSchool: UserSchool & {
        school: School;
      };
    };
    token: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
    registered: boolean;
  }> {
    const passwordRemovedData = excludeUserPassword(user, ['password']);

    const tokenData = this.createToken(user);
    const refreshToken = this.createToken(user, 15);
    const cookie = this.createCookie(tokenData);

    if (user.userSchool) {
      const findSchool = await this.schoolService.getSchoolInfoById(user.userSchool.schoolId);

      return {
        cookie,
        findUser: {
          ...passwordRemovedData,
          userSchool: {
            ...user.userSchool,
            school: findSchool,
          },
        } as any,
        token: {
          accessToken: tokenData.token,
          refreshToken: refreshToken.token,
          expiresIn: tokenData.expiresIn,
        },
        registered,
      };
    }

    return {
      cookie,
      findUser: {
        ...passwordRemovedData,
        userSchool: null,
      } as any,
      token: {
        accessToken: tokenData.token,
        refreshToken: refreshToken.token,
        expiresIn: tokenData.expiresIn,
      },
      registered,
    };
  }

  public async getMe(userData: UserWithSchool): Promise<any> {
    const passwordRemovedData = excludeUserPassword(userData, ['password']);
    if (userData.userSchoolId) {
      const findSchool = await this.schoolService.getSchoolInfoById(userData.userSchoolId);

      return {
        ...passwordRemovedData,
        userSchool: {
          ...userData.userSchool,
          school: findSchool,
        },
      };
    }

    return {
      ...passwordRemovedData,
      userSchool: null,
    };
  }

  public async appToken(
    accessToken: string,
    pushToken?: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    let verificationResponse: DataStoredInToken;
    try {
      verificationResponse = verify(accessToken, SECRET_KEY) as DataStoredInToken;
    } catch (error) {
      throw new HttpException(409, '만료된 토큰입니다.');
    }

    if (!verificationResponse) throw new HttpException(409, '만료된 토큰입니다.');

    const userId = verificationResponse.id;

    const findUser = await this.users.findUnique({
      where: {
        id: userId,
      },
    });

    if (!findUser) throw new HttpException(409, '가입되지 않은 사용자입니다.');

    if (pushToken) {
      const pushDeviceData = await this.pushDevice.findFirst({
        where: {
          token: pushToken,
        },
      });

      if (!pushDeviceData) {
        await this.pushDevice.create({
          data: {
            token: pushToken,
            userId: findUser.id,
          },
        });
      } else {
        await this.pushDevice.update({
          where: {
            id: pushDeviceData.id,
          },
          data: {
            userId: findUser.id,
          },
        });
      }
    }

    const tokenData = this.createToken(findUser);
    const refreshTokenData = this.createToken(findUser, 15);

    return {
      accessToken: tokenData.token,
      refreshToken: refreshTokenData.token,
    };
  }

  public async appRefreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    let verificationResponse: DataStoredInToken;
    try {
      verificationResponse = verify(refreshToken, SECRET_KEY) as DataStoredInToken;
    } catch (error) {
      throw new HttpException(409, '만료된 토큰입니다.');
    }

    if (!verificationResponse) throw new HttpException(409, '만료된 토큰입니다.');

    const userId = verificationResponse.id;

    const findUser = await this.users.findUnique({
      where: {
        id: userId,
      },
    });

    if (!findUser) throw new HttpException(409, '가입되지 않은 사용자입니다.');

    const tokenData = this.createToken(findUser);
    const refreshTokenData = this.createToken(findUser, 15);

    return {
      accessToken: tokenData.token,
      refreshToken: refreshTokenData.token,
    };
  }

  public async appLogin(token: string): Promise<any> {
    let verificationResponse: DataStoredInToken;
    try {
      verificationResponse = verify(token, SECRET_KEY) as DataStoredInToken;
    } catch (error) {
      throw new HttpException(409, '만료된 토큰입니다.');
    }

    if (!verificationResponse) throw new HttpException(409, '만료된 토큰입니다.');

    const userId = verificationResponse.id;

    const findUser = await this.users.findUnique({
      where: {
        id: userId,
      },
      include: {
        userSchool: true,
      },
    });

    if (!findUser) throw new HttpException(409, '가입되지 않은 사용자입니다.');

    const loginData = await this.initializeLoginData(findUser, true);

    return loginData;
  }

  public async login(userData: LoginUserDto): Promise<any> {
    const findUser = await this.users.findUnique({
      where: {
        phone: userData.phone,
      },
      include: {
        userSchool: true,
      },
    });
    if (!findUser) throw new HttpException(409, '가입되지 않은 사용자입니다.');

    const isPasswordMatching: boolean = await bcrypt.compare(userData.password, findUser.password);
    if (!isPasswordMatching) throw new HttpException(409, '비밀번호가 일치하지 않습니다.');

    const loginData = await this.initializeLoginData(findUser, true);

    return loginData;
  }

  public async signUp(userData: CreateUserDto): Promise<User> {
    const findPhone = await this.phoneVerifyRequest.findUnique({
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
          isVerified: true,
          agreement: {
            create: {
              receive: userData.marketingAgree,
            },
          },
        },
      });

      const passwordRemovedData = excludeUserPassword(createUserData, ['password']);

      return passwordRemovedData as User;
    }

    const findSocialUser = await this.socialLogin.findUnique({
      where: {
        socialId: userData.socialId,
      },
      select: {
        user: true,
      },
    });
    if (findSocialUser.user.isVerified) throw new HttpException(409, '이미 가입된 소셜 아이디가 있습니다.');

    const updateUser = await this.users.update({
      where: {
        id: findSocialUser.user.id,
      },
      data: {
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        isVerified: true,
        agreement: {
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
    });

    const passwordRemovedData = excludeUserPassword(updateUser, ['password']);

    return passwordRemovedData as User;
  }

  public async updatePassword(userData: User, password: string, newPassword: string): Promise<boolean> {
    const findUser = await this.users.findUnique({
      where: {
        id: userData.id,
      },
    });
    if (!findUser) throw new HttpException(409, '가입되지 않은 사용자입니다.');
    if (findUser.provider !== 'id') throw new HttpException(409, '소셜 로그인 사용자는 비밀번호를 변경할 수 없습니다.');

    const isPasswordMatching: boolean = await bcrypt.compare(password, findUser.password);
    if (!isPasswordMatching) throw new HttpException(409, '비밀번호가 일치하지 않습니다.');

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.users.update({
      where: {
        id: userData.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    return true;
  }

  public async updateEmail(userData: User, email: string): Promise<boolean> {
    const findUser = await this.users.findUnique({
      where: {
        id: userData.id,
      },
    });

    if (!findUser) throw new HttpException(409, '가입되지 않은 사용자입니다.');

    await this.users.update({
      where: {
        id: userData.id,
      },
      data: {
        email,
      },
    });

    return true;
  }

  public async deleteUser(userData: User, verfiyDto: VerifyPhoneCodeDto): Promise<boolean> {
    await this.verifyPhoneCode(verfiyDto.phone, verfiyDto.code, verfiyDto.token);

    const findUser = await this.users.findUnique({
      where: {
        id: userData.id,
      },
    });

    if (!findUser) throw new HttpException(409, '가입되지 않은 사용자입니다.');

    await this.users.delete({
      where: {
        id: userData.id,
      },
    });

    return true;
  }

  public async updateProfile(userData: User, file: Express.MulterS3.File): Promise<string> {
    if (userData.profile) {
      await deleteImage(userData.profile);
    }

    if (!file) {
      await this.users.update({
        where: {
          id: userData.id,
        },
        data: {
          profile: null,
        },
      });

      return null;
    }

    await this.users.update({
      where: {
        id: userData.id,
      },
      data: {
        profile: file.key,
      },
    });

    return file.key;
  }

  public async updateNickname(userData: User, newNickname: string): Promise<boolean> {
    await this.users.update({
      where: {
        id: userData.id,
      },
      data: {
        name: newNickname,
      },
    });

    return true;
  }

  public async sendVerifyMessage(phone: string, authed: boolean): Promise<string> {
    if (!authed) {
      const findUser = await this.users.findUnique({
        where: {
          phone: phone,
        },
      });
      if (findUser) throw new HttpException(409, '이미 가입된 전화번호입니다.');
    }

    const verifyCode = Math.floor(1000 + Math.random() * 9000).toString();

    const verifyPhone = await this.phoneVerifyRequest.create({
      data: {
        phone,
        code: verifyCode,
      },
    });

    try {
      await this.adminService.sendMessage('VERIFY_MESSAGE', phone, {
        '#{인증번호}': verifyCode,
      });
    } catch (error) {
      throw new HttpException(400, '메시지 전송에 실패했습니다.');
    }

    return verifyPhone.id;
  }

  public async verifyPhoneCode(phone: string, code: string, token: string): Promise<boolean> {
    const verifyPhone = await this.phoneVerifyRequest.findUnique({
      where: {
        id: token,
      },
    });

    if (!verifyPhone) throw new HttpException(400, '인증번호가 만료되었습니다.');

    if (verifyPhone.phone !== phone) throw new HttpException(400, '인증번호가 일치하지 않습니다.');

    if (verifyPhone.code !== code) throw new HttpException(400, '인증번호가 일치하지 않습니다.');

    return true;
  }

  public async deleteImage(imageId: string, userData: User): Promise<Image> {
    const findImage = await this.image.findUnique({
      where: {
        id: imageId,
      },
    });
    if (!findImage) throw new HttpException(400, '이미지를 찾을 수 없습니다');
    if (findImage.userId !== userData.id) throw new HttpException(400, '이미지를 삭제할 권한이 없습니다');

    await deleteImage(findImage.key);

    return findImage;
  }

  public createToken(user: User, expires?: number): TokenData {
    const dataStoredInToken: DataStoredInToken = { id: user.id };
    const secretKey: string = SECRET_KEY;
    const expiresIn: number = 60 * 60 * 24 * (expires || 7);

    return { expiresIn, token: sign(dataStoredInToken, secretKey, { expiresIn }) };
  }

  public createCookie(tokenData: TokenData): string {
    return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn}; Domain=${DOMAIN}; Path=/`;
  }
}
