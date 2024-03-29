import { NextFunction, Response } from 'express';
import { User } from '@prisma/client';
import { RequestWithUser } from '@interfaces/auth.interface';
import {
  GOOGLE_REDIRECT_URI,
  GOOGLE_CLIENT_KEY,
  KAKAO_CLIENT_KEY,
  KAKAO_REDIRECT_URI,
  DOMAIN,
  INSTAGRAM_CLIENT_KEY,
  INSTAGRAM_REDIRECT_URI,
  FTONT_DOMAIN,
  RIOT_REDIRECT_URI,
  RIOT_CLIENT_KEY,
} from '@/config';
import ResponseWrapper from '@/utils/responseWarpper';
import { RequestHandler } from '@/interfaces/routes.interface';
import {
  AppleLoginUser,
  ChangeEmailDto,
  ChangePasswordDto,
  CreateUserDto,
  LoginUserDto,
  TokenDto,
  UpdateAskedCustomIdDto,
  UpdatePasswordDto,
  VerifyPhoneCodeDto,
  VerifyPhoneMessageDto,
} from '@/dtos/users.dto';
import { AskedService } from '@/services/asked.service';
import { AuthService } from '@services/auth.service';
import { Container } from 'typedi';

class AuthController {
  public authService = Container.get(AuthService);
  public askedService = Container.get(AskedService);

  public me = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: User = req.user;
      const me = await this.authService.getMe(userData);

      ResponseWrapper(req, res, { data: me });
    } catch (error) {
      next(error);
    }
  };

  public appToken = async (req: RequestHandler, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = req.body as TokenDto;
      const token = await this.authService.appToken(data.token, data.pushToken);

      ResponseWrapper(req, res, { data: token });
    } catch (error) {
      next(error);
    }
  };

  public appRefreshToken = async (req: RequestHandler, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = await this.authService.appRefreshToken(req.body.token);

      ResponseWrapper(req, res, { data: token });
    } catch (error) {
      next(error);
    }
  };

  public appLogin = async (req: RequestHandler, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tokenData = req.query.code as string;
      const { cookie, findUser, token, registered } = await this.authService.appLogin(tokenData);

      res.setHeader('Set-Cookie', [cookie]);
      ResponseWrapper(req, res, {
        data: {
          user: findUser,
          token: token,
          registered: registered,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public meSchool = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: User = req.user;
      const meSchool = await this.authService.meSchool(userData);

      ResponseWrapper(req, res, { data: meSchool });
    } catch (error) {
      next(error);
    }
  };

  public meAsked = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: User = req.user;
      const page = req.query.page as string;

      const meAsked = await this.askedService.meAsked(userData, page);

      ResponseWrapper(req, res, { data: meAsked });
    } catch (error) {
      next(error);
    }
  };

  public meSchoolVerify = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: User = req.user;
      const meSchoolVerify = await this.authService.meSchoolVerify(userData);

      ResponseWrapper(req, res, { data: meSchoolVerify });
    } catch (error) {
      next(error);
    }
  };

  public meConnectAccount = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: User = req.user;
      const meConnectAccount = await this.authService.meConnectAccount(userData);

      ResponseWrapper(req, res, { data: meConnectAccount });
    } catch (error) {
      next(error);
    }
  };

  public meAskedQuestions = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: User = req.user;
      const page = req.query.page as string;
      const meAskedQuestions = await this.askedService.meAskedQuestions(userData, page);

      ResponseWrapper(req, res, { data: meAskedQuestions });
    } catch (error) {
      next(error);
    }
  };

  public logOut = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.setHeader('Set-Cookie', [`Authorization=; Max-age=0; Path=/; HttpOnly; Domain=${DOMAIN};`]);
      ResponseWrapper(req, res, {});
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

  public kakaoLoginCallback = async (req: RequestHandler, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code } = req.query;
      if (!code) return res.redirect('/auth/kakao');
      const { cookie, findUser, registered, token } = await this.authService.kakaoLogin(code as string);
      
      res.setHeader('Set-Cookie', [cookie]);
      ResponseWrapper(req, res, {
        data: {
          user: findUser,
          token: token,
          registered: registered,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public appleLoginCallback = async (req: RequestHandler, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code } = req.query;
      const { name } = req.body as AppleLoginUser;
      const { cookie, findUser, registered, token } = await this.authService.appleLogin(code as string, name);

      res.setHeader('Set-Cookie', [cookie]);
      ResponseWrapper(req, res, {
        data: {
          user: findUser,
          token: token,
          registered: registered,
        },
      });
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

  public instagramLogin = async (req: RequestHandler, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.redirect(
        `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_CLIENT_KEY}&redirect_uri=${INSTAGRAM_REDIRECT_URI}&scope=user_profile&response_type=code`,
      );
    } catch (error) {
      next(error);
    }
  };

  public connectLeagueoflegendsAccount = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.redirect(
        `https://auth.riotgames.com/authorize?client_id=${RIOT_CLIENT_KEY}&redirect_uri=${RIOT_REDIRECT_URI}&response_type=code&scope=openid`,
      );
    } catch (error) {
      next(error);
    }
  };

  public connectLeagueoflegendsAccountCallback = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      const code = req.query.code as string;
      if (!code) return this.connectLeagueoflegendsAccount(req, res, next);
      await this.authService.connectLeagueoflegendsCallback(user, code);
      res.redirect(`${FTONT_DOMAIN}/me/connectaccount/connect/leagueoflegends`);
    } catch (error) {
      res.redirect(`${FTONT_DOMAIN}/me/connectaccount/connect/leagueoflegends?message=${error.message}`);
    }
  };

  public instagramLoginCallback = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      const code = req.query.code as string;
      if (!code) return this.instagramLogin(req, res, next);
      const fightData = await this.authService.instagramLoginCallback(user, code);
      res.redirect(`${FTONT_DOMAIN}/me/connectaccount/connect/instagram`);
    } catch (error) {
      next(error);
    }
  };

  public disconnectInstagramAccount = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      const disconnect = await this.authService.disconnectInstagramAccount(user);
      ResponseWrapper(req, res, { data: disconnect });
    } catch (error) {
      next(error);
    }
  };

  public disconnectLeagueoflegendsAccount = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      const disconnect = await this.authService.disconnectLeagueoflegendsAccount(user);
      ResponseWrapper(req, res, { data: disconnect });
    } catch (error) {
      next(error);
    }
  };

  public googleLoginCallback = async (req: RequestHandler, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code } = req.query;
      if (!code) return res.redirect('/auth/google');
      const { cookie, findUser, registered, token } = await this.authService.googleLogin(code as string);

      res.setHeader('Set-Cookie', [cookie]);
      ResponseWrapper(req, res, {
        data: {
          user: findUser,
          token: token,
          registered: registered,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public uploadImage = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const uploadImageData = await this.authService.uploadImage(req.user, req.file as Express.MulterS3.File);

      ResponseWrapper(req, res, { data: uploadImageData });
    } catch (error) {
      next(error);
    }
  };

  public login = async (req: RequestHandler, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData = req.body as LoginUserDto;
      const { cookie, findUser, token, registered } = await this.authService.login(userData);

      res.setHeader('Set-Cookie', [cookie]);
      ResponseWrapper(req, res, {
        data: {
          user: findUser,
          token: token,
          registered: registered,
        },
      });
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

  public updatePassword = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: User = req.user;
      const { password, newPassword } = req.body as UpdatePasswordDto;
      const updatePasswordUserData: boolean = await this.authService.updatePassword(userData, password, newPassword);
      ResponseWrapper(req, res, { data: updatePasswordUserData });
    } catch (error) {
      next(error);
    }
  };

  public updateProfile = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: User = req.user;
      const updateProfileUserData: string = await this.authService.updateProfile(userData, req.file as Express.MulterS3.File);

      ResponseWrapper(req, res, { data: updateProfileUserData });
    } catch (error) {
      next(error);
    }
  };

  public deleteUser = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const verfiyDto = req.body as VerifyPhoneCodeDto;
      const userData: User = req.user;
      const deleteUserUserData: boolean = await this.authService.deleteUser(userData, verfiyDto);

      ResponseWrapper(req, res, { data: deleteUserUserData });
    } catch (error) {
      next(error);
    }
  };

  public updateEmail = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: User = req.user;
      const { email } = req.body as ChangeEmailDto;
      const updateEmailUserData: boolean = await this.authService.updateEmail(userData, email);

      ResponseWrapper(req, res, { data: updateEmailUserData });
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

  public OuathLoginVerifyPhone = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const verify = await this.authService.ouathLoginVerifyPhone(req.user, req.body);

      ResponseWrapper(req, res, { data: verify });
    } catch (error) {
      next(error);
    }
  };

  public findPasswordSendSms = async (req: RequestHandler, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { phone } = req.body as VerifyPhoneMessageDto;
      const verify = await this.authService.findPasswordSendSms(phone);

      ResponseWrapper(req, res, { data: verify });
    } catch (error) {
      next(error);
    }
  };

  public findPasswordUpdatePass = async (req: RequestHandler, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { password, phone, code, token } = req.body as ChangePasswordDto;
      const verify = await this.authService.findPasswordUpdatePassword(phone, password, code, token);

      ResponseWrapper(req, res, { data: verify });
    } catch (error) {
      next(error);
    }
  };

  public sendVerifyMessage = async (req: RequestHandler, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { phone } = req.body as VerifyPhoneMessageDto;
      const verifyId = await this.authService.sendVerifyMessage(phone, false);

      ResponseWrapper(req, res, { data: verifyId });
    } catch (error) {
      next(error);
    }
  };

  public sendAuthVerifyMessage = async (req: RequestHandler, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { phone } = req.body as VerifyPhoneMessageDto;
      const verifyId = await this.authService.sendVerifyMessage(phone, true);

      ResponseWrapper(req, res, { data: verifyId });
    } catch (error) {
      next(error);
    }
  };

  public meAskedCustomId = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: User = req.user;
      const { customId } = req.body as UpdateAskedCustomIdDto;
      const updateAskedCustomId = await this.askedService.updateAskedCustomId(userData, customId);

      ResponseWrapper(req, res, { data: updateAskedCustomId });
    } catch (error) {
      next(error);
    }
  };

  public updateNickname = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: User = req.user;
      const nickname: string = req.body.nickname;
      const updateNicknameUserData: boolean = await this.authService.updateNickname(userData, nickname);

      ResponseWrapper(req, res, { data: updateNicknameUserData });
    } catch (error) {
      next(error);
    }
  };

  public deleteImage = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const deleteImageData = await this.authService.deleteImage(req.params.imageId, req.user);

      ResponseWrapper(req, res, { data: deleteImageData });
    } catch (error) {
      next(error);
    }
  };
}

export default AuthController;
