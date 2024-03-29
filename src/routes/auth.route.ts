import { Router } from 'express';
import AuthController from '@controllers/auth.controller';
import { Routes } from '@interfaces/routes.interface';
import authMiddleware, { authQueryMiddleware } from '@middlewares/auth.middleware';
import validationMiddleware from '@middlewares/validation.middleware';
import { imageUpload } from '@/utils/multer';
import {
  AppleLoginUser,
  ChangeEmailDto,
  ChangePasswordDto,
  CreateUserDto,
  LoginUserDto,
  TokenDto,
  UpdateAskedCustomIdDto,
  UpdateNicknameDto,
  UpdatePasswordDto,
  VerifyPhoneCodeDto,
  VerifyPhoneMessageDto,
} from '@/dtos/users.dto';
import { verifyPhoneRateLimit } from '@/middlewares/ratelimit.middleware';

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
    this.router.get(`${this.path}/me/asked`, authMiddleware, this.authController.meAsked);
    this.router.get(`${this.path}/me/askedquestions`, authMiddleware, this.authController.meAskedQuestions);
    this.router.get(`${this.path}/me/schoolverify`, authMiddleware, this.authController.meSchoolVerify);
    this.router.get(`${this.path}/me/connectaccount`, authMiddleware, this.authController.meConnectAccount);
    this.router.get(`${this.path}/logout`, this.authController.logOut);
    this.router.get(`${this.path}/kakao`, this.authController.kakaoLogin);
    this.router.get(`${this.path}/kakao/callback`, this.authController.kakaoLoginCallback);
    this.router.get(`${this.path}/google`, this.authController.googleLogin);
    this.router.get(`${this.path}/google/callback`, this.authController.googleLoginCallback);
    this.router.get(`${this.path}/instagram`, authQueryMiddleware, this.authController.instagramLogin);
    this.router.get(`${this.path}/instagram/callback`, authQueryMiddleware, this.authController.instagramLoginCallback);
    this.router.get(`${this.path}/connect/leagueoflegends`, authQueryMiddleware, this.authController.connectLeagueoflegendsAccount);
    this.router.get(`${this.path}/connect/leagueoflegends/callback`, authQueryMiddleware, this.authController.connectLeagueoflegendsAccountCallback);
    this.router.post(`${this.path}/apple/callback`, validationMiddleware(AppleLoginUser, 'body'), this.authController.appleLoginCallback);
    this.router.post(`/image`, authMiddleware, imageUpload.single('img'), this.authController.uploadImage);
    this.router.post(`${this.path}/login`, validationMiddleware(LoginUserDto, 'body'), this.authController.login);
    this.router.post(`${this.path}/applogin`, this.authController.appLogin);
    this.router.post(`${this.path}/signup`, validationMiddleware(CreateUserDto, 'body'), this.authController.signUp);
    this.router.post(`${this.path}/apptoken`, validationMiddleware(TokenDto, 'body'), this.authController.appToken);
    this.router.post(`${this.path}/apprefreshtoken`, validationMiddleware(TokenDto, 'body'), this.authController.appRefreshToken);
    this.router.post(`${this.path}/changepass`, validationMiddleware(UpdatePasswordDto, 'body'), authMiddleware, this.authController.updatePassword);
    this.router.post(
      `${this.path}/findpass/sendsms`,
      verifyPhoneRateLimit,
      validationMiddleware(VerifyPhoneMessageDto, 'body'),
      this.authController.findPasswordSendSms,
    );
    this.router.post(`${this.path}/findpass/updatepass`, validationMiddleware(ChangePasswordDto, 'body'), this.authController.findPasswordUpdatePass);
    this.router.post(`${this.path}/verify/phone`, validationMiddleware(VerifyPhoneCodeDto, 'body'), this.authController.verifyPhoneCode);
    this.router.post(
      `${this.path}/verify/phonemessage`,
      verifyPhoneRateLimit,
      validationMiddleware(VerifyPhoneMessageDto, 'body'),
      this.authController.sendVerifyMessage,
    );
    this.router.post(
      `${this.path}/verify/login/phonemessage`,
      verifyPhoneRateLimit,
      authMiddleware,
      validationMiddleware(VerifyPhoneMessageDto, 'body'),
      this.authController.sendAuthVerifyMessage,
    );
    this.router.post(
      `${this.path}/oauth/verify/phone`,
      authMiddleware,
      validationMiddleware(VerifyPhoneCodeDto, 'body'),
      this.authController.OuathLoginVerifyPhone,
    );
    this.router.patch(`${this.path}/me/profile`, authMiddleware, imageUpload.single('img'), this.authController.updateProfile);
    this.router.patch(`${this.path}/me/email`, authMiddleware, validationMiddleware(ChangeEmailDto, 'body'), this.authController.updateEmail);
    this.router.patch(
      `${this.path}/me/asked`,
      validationMiddleware(UpdateAskedCustomIdDto, 'body'),
      authMiddleware,
      this.authController.meAskedCustomId,
    );
    this.router.patch(
      `${this.path}/me/nickname`,
      authMiddleware,
      validationMiddleware(UpdateNicknameDto, 'body'),
      this.authController.updateNickname,
    );
    this.router.delete(`/auth/me/disconnectaccount/instagram`, authMiddleware, this.authController.disconnectInstagramAccount);
    this.router.delete(`/auth/me/disconnectaccount/leagueoflegends`, authMiddleware, this.authController.disconnectLeagueoflegendsAccount);
    this.router.delete(`/image/:imageId`, authMiddleware, this.authController.deleteImage);
    this.router.delete(`${this.path}/me/profile`, authMiddleware, this.authController.updateProfile);
    this.router.delete(`${this.path}/me`, validationMiddleware(VerifyPhoneCodeDto, 'body'), authMiddleware, this.authController.deleteUser);
  }
}

export default AuthRoute;
