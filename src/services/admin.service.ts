import bcrypt from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { DOMAIN, MESSAGE_FROM, SECRET_KEY, SOL_API_KEY, SOL_API_PFID, SOL_API_SECRET } from '@/config';
import { AdminDto } from '@/dtos/admin.dto';
import { HttpException } from '@/exceptions/HttpException';
import { DataStoredInToken, TokenData } from '@/interfaces/auth.interface';
import { PushMessage, SMS_TEMPLATE_ID, SmsEvent } from '@/interfaces/admin.interface';
import { deleteImage } from '@/utils/multer';
import { excludeAdminPassword } from '@/utils/util';
import { Admin, Article, BoardRequest, Process, Report, ReportTargetType, School, User, UserSchoolVerify } from '@prisma/client';
import { SchoolService } from './school.service';
import { processMap } from '@/utils/util';
import Expo, { ExpoPushTicket } from 'expo-server-sdk';
import { SolapiMessageService } from 'solapi';
import Container, { Service } from 'typedi';
import { PrismaClientService } from './prisma.service';

@Service()
export class AdminService {
  public schoolService = Container.get(SchoolService);

  public admin = Container.get(PrismaClientService).admin;
  public article = Container.get(PrismaClientService).article;
  public board = Container.get(PrismaClientService).board;
  public boardRequest = Container.get(PrismaClientService).boardRequest;
  public deletedArticle = Container.get(PrismaClientService).deletedArticle;
  public image = Container.get(PrismaClientService).image;
  public report = Container.get(PrismaClientService).report;
  public users = Container.get(PrismaClientService).user;
  public userSchool = Container.get(PrismaClientService).userSchool;
  public userSchoolVerify = Container.get(PrismaClientService).userSchoolVerify;
  public school = Container.get(PrismaClientService).school;
  public expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });
  public messageService = new SolapiMessageService(SOL_API_KEY, SOL_API_SECRET);

  public async signUpService(adminData: AdminDto): Promise<Admin> {
    const findAdmin: Admin = await this.admin.findUnique({ where: { loginId: adminData.id } });
    if (findAdmin) throw new HttpException(409, `이미 존재하는 아이디입니다.`);

    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    const createAdminData = await this.admin.create({
      data: {
        loginId: adminData.id,
        password: hashedPassword,
        flags: 2 << 0,
      },
    });

    const passwordRemovedData = excludeAdminPassword(createAdminData, ['password']);
    return passwordRemovedData as Admin;
  }

  public async loginService(adminData: AdminDto): Promise<{ cookie: string; findAdmin: Admin }> {
    const findAdmin = await this.admin.findUnique({
      where: {
        loginId: adminData.id,
      },
    });

    if (!findAdmin) throw new HttpException(409, '어드민을 찾을 수 없습니다.');

    const isPasswordMatch: boolean = await bcrypt.compare(adminData.password, findAdmin.password);
    if (!isPasswordMatch) throw new HttpException(409, '비밀번호가 일치하지 않습니다.');

    const passwordRemovedData = excludeAdminPassword(findAdmin, ['password']);
    const tokenData = this.createToken(findAdmin);
    const cookie = this.createCookie(tokenData);
    return {
      cookie,
      findAdmin: passwordRemovedData as Admin,
    };
  }

  public async logoutService(adminData: Admin): Promise<Admin> {
    const findAdmin: Admin = await this.admin.findFirst({ where: { id: adminData.id } });
    if (!findAdmin) throw new HttpException(409, '어드민을 찾을 수 없습니다.');

    return findAdmin;
  }

  public deleteImageService = async (imageId: string): Promise<boolean> => {
    const findImage = await this.image.findUnique({ where: { id: imageId } });
    if (!findImage) throw new HttpException(409, '이미지를 찾을 수 없습니다.');

    try {
      await deleteImage(findImage.key);
    } catch (error) {
      throw error;
    }

    return true;
  };

  public getVerifyRequests = async (process: Process): Promise<Array<UserSchoolVerify>> => {
    const requests = await this.userSchoolVerify.findMany({
      where: {
        process: process,
      },
      include: {
        user: true,
        image: true,
      },
    });

    return requests;
  };

  public postVerifyRequest = async (requestId: string, message: string, process: Process): Promise<boolean> => {
    if (process === Process.pending) throw new HttpException(409, '올바른 상태를 입력해주세요.');
    const findRequest = await this.userSchoolVerify.findUnique({ where: { id: requestId } });
    if (!findRequest) throw new HttpException(409, '해당 요청을 찾을 수 없습니다.');
    if (findRequest.process !== Process.pending) throw new HttpException(409, '이미 처리된 요청입니다.');

    const schoolInfo = await this.schoolService.getSchoolInfoById(findRequest.schoolId);
    if (!schoolInfo) throw new HttpException(409, '해당 학교를 찾을 수 없습니다.');

    const isUserSchool = await this.users.findUnique({
      where: {
        id: findRequest.userId,
      },
      include: {
        userSchool: true,
      },
    });

    if (isUserSchool.userSchool) {
      await this.userSchool.update({
        where: {
          userId: isUserSchool.id,
        },
        data: {
          schoolId: schoolInfo.schoolId,
          dept: findRequest.dept,
          class: findRequest.class,
          grade: findRequest.grade,
        },
      });
    } else {
      await this.userSchool.create({
        data: {
          userId: findRequest.userId,
          schoolId: schoolInfo.schoolId,
          dept: findRequest.dept,
          class: findRequest.class,
          grade: findRequest.grade,
        },
      });
    }

    await this.users.update({
      where: { id: findRequest.userId },
      data: {
        userSchoolId: findRequest.schoolId,
      },
    });

    await this.userSchoolVerify.update({
      where: { id: findRequest.id },
      data: {
        message: message,
        process: process,
      },
    });

    await this.sendPushNotification(findRequest.userId, '🎉 축하합니다!', `${schoolInfo.defaultName} 학생 인증이 완료되었어요!`, {
      type: 'resetstack',
      url: '/me',
    });

    return true;
  };

  public getBoardRequests = async (process: string): Promise<Array<BoardRequest>> => {
    const requests = await this.boardRequest.findMany({
      where: {
        process: processMap[process],
      },
    });
    return requests;
  };

  public postBoardRequest = async (requestId: string, message: string, process: Process): Promise<BoardRequest> => {
    if (process === Process.pending) throw new HttpException(409, '올바른 상태를 입력해주세요.');
    const findRequest = await this.boardRequest.findUnique({ where: { id: requestId } });
    if (!findRequest) throw new HttpException(409, '해당 요청을 찾을 수 없습니다.');

    const findBoardName = await this.board.findFirst({ where: { name: findRequest.name } });

    if (findBoardName) throw new HttpException(409, '이미 존재하는 게시판입니다.');

    const updateRequest = await this.boardRequest.update({
      where: { id: findRequest.id },
      data: {
        message: message,
        process: process,
      },
    });

    if (process === Process.success) {
      await this.board.create({
        data: {
          schoolId: updateRequest.schoolId,
          name: updateRequest.name,
          description: updateRequest.description,
        },
      });
    }
    return updateRequest;
  };

  public getReports = async (process: string, targetType: ReportTargetType): Promise<Array<Report>> => {
    const requests = await this.report.findMany({
      where: {
        process: processMap[process],
        targetType: targetType,
      },
    });
    return requests;
  };

  public completeReport = async (reportId: string): Promise<Report> => {
    const findReport = await this.report.findFirst({ where: { id: reportId } });
    if (!findReport) throw new HttpException(409, '해당 신고를 찾을 수 없습니다.');

    const updateReport = await this.report.update({
      where: { id: findReport.id },
      data: {
        process: Process.success,
      },
    });
    return updateReport;
  };

  public sendPushNotification = async <T extends keyof PushMessage>(
    userId: string,
    title: string,
    body: string,
    data: {
      type: T;
      url: PushMessage[T];
    },
  ): Promise<ExpoPushTicket[]> => {
    try {
      const findUser = await this.users.findUnique({ where: { id: userId }, include: { pushDevice: true } });
      if (!findUser) throw new HttpException(409, '해당 유저를 찾을 수 없습니다.');
      if (findUser.pushDevice.length === 0) return [];
      const pushTokens = findUser.pushDevice.map(device => device.token);

      const pushNotificationResult = await this.expo.sendPushNotificationsAsync([
        {
          to: pushTokens,
          sound: 'default',
          title: title,
          body: body,
          data: data,
        },
      ]);

      return pushNotificationResult;
    } catch (error) {
      throw error;
    }
  };

  public sendMessage = async <T extends keyof SmsEvent>(type: T, phone: string, data?: SmsEvent[T]): Promise<void> => {
    try {
      await this.messageService.sendOne({
        to: phone,
        from: MESSAGE_FROM,
        kakaoOptions: {
          pfId: SOL_API_PFID,
          templateId: SMS_TEMPLATE_ID[type],
          variables: data ? data : {},
        },
      });

      return;
    } catch (e) {
      throw new HttpException(400, '인증번호 전송을 실패하였습니다');
    }
  };

  public deleteBoardArticle = async (boardId: string, articleId: string): Promise<boolean> => {
    const findBoard = await this.board.findUnique({ where: { id: Number(boardId) } });
    if (!findBoard) throw new HttpException(409, '해당 게시판을 찾을 수 없습니다.');

    const findArticle = await this.article.findUnique({ where: { id: Number(articleId) } });
    if (!findArticle) throw new HttpException(409, '해당 게시글을 찾을 수 없습니다.');

    try {
      await this.article.delete({ where: { id: Number(articleId) } });
      await this.deletedArticle.create({
        data: {
          id: Number(findArticle.id),
          schoolId: findArticle.schoolId,
          title: findArticle.title,
          content: findArticle.content,
          images: findArticle.images,
          isAnonymous: findArticle.isAnonymous,
          userId: findArticle.userId,
          createdAt: findArticle.createdAt,
          boardId: findArticle.boardId,
          views: findArticle.views,
        },
      });
    } catch (error) {
      throw error;
    }
    return true;
  };

  public getUserInfo = async (userId: string): Promise<User> => {
    const findUser = await this.users.findUnique({ where: { id: userId } });
    if (!findUser) throw new HttpException(409, '해당 유저를 찾을 수 없습니다.');

    return findUser;
  };

  public async getAllUsers(page: string): Promise<Array<User>> {
    const users = await this.users.findMany({
      include: {
        userSchool: {
          include: {
            school: true,
          },
        },
      },
      skip: isNaN(Number(page)) ? 0 : (Number(page) - 1) * 100,
      take: 100,
    });
    return users;
  }

  public async getAllArticles(page: string): Promise<Array<Article>> {
    const articles = await this.article.findMany({
      include: {
        user: true,
        board: true,
      },
      skip: isNaN(Number(page)) ? 0 : (Number(page) - 1) * 100,
      take: 100,
    });
    return articles;
  }

  public async getAllSchools(page: string): Promise<Array<School>> {
    const schools = await this.school.findMany({
      skip: isNaN(Number(page)) ? 0 : (Number(page) - 1) * 100,
      take: 100,
    });
    return schools;
  }

  public async setSchoolName(schoolId: string, name: string): Promise<School> {
    const findSchool = await this.school.findUnique({ where: { schoolId: schoolId } });
    if (!findSchool) throw new HttpException(409, '해당 학교를 찾을 수 없습니다.');

    const updateSchool = await this.school.update({
      where: { schoolId: schoolId },
      data: {
        name: name,
      },
    });

    return updateSchool;
  }

  public createToken(admin: Admin): TokenData {
    const dataStoredInToken: DataStoredInToken = { id: admin.id };
    const secretKey: string = SECRET_KEY;
    const expiresIn: number = 60 * 60;

    return { expiresIn, token: sign(dataStoredInToken, secretKey, { expiresIn }) };
  }

  public createCookie(tokenData: TokenData): string {
    return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn}; Domain=${DOMAIN}; Path=/`;
  }
}
