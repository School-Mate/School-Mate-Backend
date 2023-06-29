import { Router } from 'express';
import AuthController from '@controllers/auth.controller';
import { Routes } from '@interfaces/routes.interface';
import authMiddleware from '@middlewares/auth.middleware';

class AuthRoute implements Routes {
  public path = '/auth';
  public router = Router();
  public authController = new AuthController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/kakao`, this.authController.kakaoLogin);
    this.router.get(`${this.path}/kakao/callback`, this.authController.kakaoLoginCallback);
    this.router.get(`${this.path}/google`, this.authController.googleLogin);
    this.router.get(`${this.path}/google/callback`, this.authController.googleLoginCallback);
    this.router.post(`${this.path}logout`, authMiddleware, this.authController.logOut);
  }
}

export default AuthRoute;
