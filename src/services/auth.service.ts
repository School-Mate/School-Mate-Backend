import { compare, hash } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { PrismaClient, SocialLogin, User, Image } from '@prisma/client';
import { DOMAIN, GOOGLE_CLIENT_KEY, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, SECRET_KEY } from '@config';
import { CreateUserDto } from '@dtos/users.dto';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, RequestWithUser, TokenData } from '@interfaces/auth.interface';
import { isEmpty } from '@utils/util';
import qs from 'qs';
import axios, { AxiosError } from 'axios';

class AuthService {
  public users = new PrismaClient().user;
  public socialLogin = new PrismaClient().socialLogin;
  public image = new PrismaClient().image;

  // public async signup(userData: CreateUserDto): Promise<User> {
  //   if (isEmpty(userData)) throw new HttpException(400, 'userData is empty');

  //   const findUser: User = await this.users.findUnique({ where: { email: userData.email } });
  //   if (findUser) throw new HttpException(409, `This email ${userData.email} already exists`);

  //   const hashedPassword = await hash(userData.password, 10);
  //   const createUserData: Promise<User> = this.users.create({ data: { ...userData, password: hashedPassword } });

  //   return createUserData;
  // }

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
