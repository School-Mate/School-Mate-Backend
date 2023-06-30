import { Router } from 'express';
import AuthController from '@controllers/auth.controller';
import { Routes } from '@interfaces/routes.interface';
import authMiddleware from '@middlewares/auth.middleware';
import validationMiddleware from '@/middlewares/validation.middleware';
import { CreateUserDto, VerifyPhoneCodeDto, VerifyPhoneMessageDto } from '@/dtos/users.dto';

class AuthRoute implements Routes {
  public path = '/auth';
  public router = Router();
  public authController = new AuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // this.router.post(`${this.path}/signup`, validationMiddleware(CreateUserDto, 'body'), this.authController.signUp);
    this.router.post(`${this.path}/verify/phonemessage`, validationMiddleware(VerifyPhoneMessageDto, 'body'), this.authController.verifyPhoneMessage);
    this.router.post(`${this.path}/verify/phone`, validationMiddleware(VerifyPhoneCodeDto, 'body'), this.authController.verifyPhoneCode);
    this.router.get(`${this.path}/kakao`, this.authController.kakaoLogin);
    this.router.get(`${this.path}/kakao/callback`, this.authController.kakaoLoginCallback);
    this.router.get(`${this.path}/google`, this.authController.googleLogin);
    this.router.get(`${this.path}/google/callback`, this.authController.googleLoginCallback);
    this.router.post(`${this.path}logout`, authMiddleware, this.authController.logOut);
  }
}

export default AuthRoute;
