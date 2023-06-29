import { NextFunction, Request, Response } from 'express';
import { User } from '@prisma/client';
import { CreateUserDto } from '@dtos/users.dto';
import { RequestWithUser } from '@interfaces/auth.interface';
import AuthService from '@services/auth.service';
import { GOOGLE_REDIRECT_URI, GOOGLE_CLIENT_KEY, KAKAO_CLIENT_KEY, KAKAO_REDIRECT_URI } from '@/config';
import ResponseWrapper from '@/utils/responseWarpper';
import { RequestHandler } from '@/interfaces/routes.interface';

class AuthController {
  public authService = new AuthService();

  public kakaoLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

  // public signUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  //   try {
  //     const userData: CreateUserDto = req.body;
  //     const signUpUserData: User = await this.authService.signup(userData);

  //     res.status(201).json({ data: signUpUserData, message: 'signup' });
  //   } catch (error) {
  //     next(error);
  //   }
  // };
      
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

  public kakaoLoginCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code } = req.query;
      if (!code) return res.redirect('auth/kakao');
      // const {cookie, findUser } = await this.authService.
    } catch (error) {
      next(error);
    }
  };

  // public signUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  //   try {
  //     const userData: CreateUserDto = req.body;
  //     const signUpUserData: User = await this.authService.signup(userData);

  //     res.status(201).json({ data: signUpUserData, message: 'signup' });
  //   } catch (error) {
  //     next(error);
  //   }
  // };

  // public logIn = async (req: RequestHandler, res: Response, next: NextFunction): Promise<void> => {
  //   try {
  //     const userData: CreateUserDto = req.body;
  //     const { cookie, findUser } = await this.authService.login(userData);

  //     res.setHeader('Set-Cookie', [cookie]);
  //     res.status(200).json({ data: findUser, message: 'login' });
  //   } catch (error) {
  //     next(error);
  //   }
  // };

  public logOut = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: User = req.user;
      const logOutUserData: User = await this.authService.logout(userData);

      res.setHeader('Set-Cookie', ['Authorization=; Max-age=0']);
      res.status(200).json({ data: logOutUserData, message: 'logout' });
    } catch (error) {
      next(error);
    }
  };
}

export default AuthController;
