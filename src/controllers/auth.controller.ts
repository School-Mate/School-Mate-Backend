import { NextFunction, Response } from 'express';
import { User } from '@prisma/client';
import { RequestWithUser } from '@interfaces/auth.interface';
import AuthService from '@services/auth.service';
import { GOOGLE_REDIRECT_URI, GOOGLE_CLIENT_KEY, KAKAO_CLIENT_KEY, KAKAO_REDIRECT_URI, DOMAIN } from '@/config';
import ResponseWrapper from '@/utils/responseWarpper';
import { RequestHandler } from '@/interfaces/routes.interface';
import { CreateUserDto, LoginUserDto, VerifyPhoneCodeDto, VerifyPhoneMessageDto } from '@/dtos/users.dto';

class AuthController {
  public authService = new AuthService();

  public me = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: User = req.user;

      ResponseWrapper(req, res, { data: userData });
    } catch (error) {
      next(error);
    }
  };

  public authInitiate = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: User = req.user;
      const authInitiateData = await this.authService.authInitiate(userData);

      ResponseWrapper(req, res, { data: authInitiateData });
    } catch (error) {
      next(error);
    }
  };

  public signUp = async (req: RequestHandler, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData = req.body as CreateUserDto;
      const signUpUserData: User = await this.authService.signUp(userData);

      const tokenData = this.authService.createToken(signUpUserData);
      const cookie = this.authService.createCookie(tokenData);

      res.setHeader('Set-Cookie', [cookie]);
      ResponseWrapper(req, res, {
        data: signUpUserData,
      });
    } catch (error) {
      next(error);
    }
  };

  public login = async (req: RequestHandler, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData = req.body as LoginUserDto;
      const { cookie, findUser } = await this.authService.login(userData);

      res.setHeader('Set-Cookie', [cookie]);
      ResponseWrapper(req, res, { data: findUser });
    } catch (error) {
      next(error);
    }
  };

  public verifyPhoneMessage = async (req: RequestHandler, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { phone } = req.body as VerifyPhoneMessageDto;
      const verifyId = await this.authService.verifyPhoneMessage(phone);

      ResponseWrapper(req, res, { data: verifyId });
    } catch (error) {
      next(error);
    }
  };

  public verifyPhoneCode = async (req: RequestHandler, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { phone, code, token } = req.body as VerifyPhoneCodeDto;
      const verify = await this.authService.verifyPhoneCode(phone, code, token);

      ResponseWrapper(req, res, { data: verify });
    } catch (error) {
      next(error);
    }
  };

  public kakaoLogin = async (req: RequestHandler, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.redirect(`https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_KEY}&redirect_uri=${KAKAO_REDIRECT_URI}&response_type=code`);
    } catch (error) {
      next(error);
    }
  };

  public googleLogin = async (req: RequestHandler, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.redirect(
        `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_KEY}&redirect_uri=${GOOGLE_REDIRECT_URI}&response_type=code&scope=email%20profile`,
      );
    } catch (error) {
      next(error);
    }
  };

  public kakaoLoginCallback = async (req: RequestHandler, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code } = req.query;
      if (!code) return res.redirect('auth/kakao');
      const { cookie, findUser } = await this.authService.kakaoLogin(code as string);

      res.setHeader('Set-Cookie', [cookie]);
      ResponseWrapper(req, res, { data: findUser });
    } catch (error) {
      next(error);
    }
  };

  public googleLoginCallback = async (req: RequestHandler, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code } = req.query;
      if (!code) return res.redirect('/auth/google');
      const { cookie, findUser } = await this.authService.googleLogin(code as string);

      res.setHeader('Set-Cookie', [cookie]);
      ResponseWrapper(req, res, { data: findUser });
    } catch (error) {
      next(error);
    }
  };

  public logOut = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: User = req.user;
      const logOutUserData: User = await this.authService.logout(userData);

      res.setHeader('Set-Cookie', [`Authorization=; Max-age=0; Path=/; HttpOnly; Domain=${DOMAIN};`]);
      ResponseWrapper(req, res, { data: logOutUserData });
    } catch (error) {
      next(error);
    }
  };

  public uploadImage = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const uploadImageData = await this.authService.uploadImage(req);

      ResponseWrapper(req, res, { data: uploadImageData });
    } catch (error) {
      next(error);
    }
  };
}

export default AuthController;
