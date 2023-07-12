import { Router } from 'express';
import AuthController from '@controllers/auth.controller';
import { Routes } from '@interfaces/routes.interface';
import authMiddleware from '@middlewares/auth.middleware';
import validationMiddleware from '@middlewares/validation.middleware';
import { imageUpload } from '@/utils/multer';
import { CreateUserDto, LoginUserDto, VerifyPhoneCodeDto, VerifyPhoneMessageDto } from '@/dtos/users.dto';

class AuthRoute implements Routes {
  public path = '/auth';
  public router = Router();
  public authController = new AuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/me`, authMiddleware, this.authController.me);
    this.router.get(`${this.path}/me/school`, authMiddleware, this.authController.meSchool);
    this.router.get(`${this.path}/logout`, authMiddleware, this.authController.logOut);
    this.router.get(`${this.path}/kakao`, this.authController.kakaoLogin);
    this.router.get(`${this.path}/kakao/callback`, this.authController.kakaoLoginCallback);
    this.router.get(`${this.path}/google`, this.authController.googleLogin);
    this.router.get(`${this.path}/google/callback`, this.authController.googleLoginCallback);
    this.router.post(`${this.path}/login`, validationMiddleware(LoginUserDto, 'body'), this.authController.login);
    this.router.post(`${this.path}/signup`, validationMiddleware(CreateUserDto, 'body'), this.authController.signUp);
    this.router.post(`${this.path}/verify/phone`, validationMiddleware(VerifyPhoneCodeDto, 'body'), this.authController.verifyPhoneCode);
    this.router.post(`${this.path}/verify/phonemessage`, validationMiddleware(VerifyPhoneMessageDto, 'body'), this.authController.verifyPhoneMessage);
    this.router.post(`/image`, authMiddleware, imageUpload.single('img'), this.authController.uploadImage);
    this.router.delete(`/image/:id`, authMiddleware, this.authController.deleteImage);
  }
}

export default AuthRoute;
