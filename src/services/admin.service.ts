import bcrypt from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { DOMAIN, MESSAGE_FROM, SECRET_KEY, SOL_API_KEY, SOL_API_PFID, SOL_API_SECRET } from '@/config';
import { AdminDto, UserBlockDto } from '@/dtos/admin.dto';
import { HttpException } from '@/exceptions/HttpException';
import { DataStoredInToken, TokenData } from '@/interfaces/auth.interface';
import { PushMessage, SMS_TEMPLATE_ID, SmsEvent } from '@/interfaces/admin.interface';
import { deleteImage } from '@/utils/multer';
import { excludeAdminPassword } from '@/utils/util';
import { Admin, Article, BoardRequest, Prisma, Process, Report, ReportTargetType, School, User, UserBlock, UserSchoolVerify } from '@prisma/client';
import { SchoolService } from './school.service';
import { processMap } from '@/utils/util';
import Expo, { ExpoPushTicket } from 'expo-server-sdk';
import { SolapiMessageService } from 'solapi';
import Container, { Service } from 'typedi';
import { PrismaClientService } from './prisma.service';
import { sendWebhook } from '@/utils/webhook';
import { WebhookType } from '@/types';
import { logger } from '@/utils/logger';
import dayjs from 'dayjs';

@Service()
export class AdminService {
  public schoolService = Container.get(SchoolService);
  public prismaClient = Container.get(PrismaClientService);
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
  public userBlock = Container.get(PrismaClientService).userBlock;
  public asked = Container.get(PrismaClientService).asked;
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

  public async analyticsService(): Promise<{
    user: any;
    article: any;
    asked: any;
  }> {
    const weekOfUserLastAndThisWeekPersent = await this.prismaClient.$queryRaw`
      WITH week_counts AS (
        SELECT
          COUNT(*)::int AS total_count,
          COUNT(*) FILTER(WHERE "createdAt" >= CURRENT_DATE - INTERVAL '7 days' AND "createdAt" < CURRENT_DATE)::int AS current_week_count,
          COUNT(*) FILTER(WHERE "createdAt" >= CURRENT_DATE - INTERVAL '14 days' AND "createdAt" < CURRENT_DATE - INTERVAL '7 days')::int AS previous_week_count
        FROM "User"
        WHERE "createdAt" >= CURRENT_DATE - INTERVAL '14 days' AND "createdAt" < CURRENT_DATE
      )

      SELECT
        total_count,
        current_week_count,
        previous_week_count,
        COALESCE((current_week_count - previous_week_count) * 100.0 / NULLIF(COALESCE(previous_week_count, 0), 0), 100) AS growth_rate
      FROM week_counts;
    `;

    const weekOfArticleLastAndThisWeekPersent = await this.prismaClient.$queryRaw`
      WITH week_counts AS (
        SELECT
          COUNT(*)::int AS total_count,
          COUNT(*) FILTER(WHERE "createdAt" >= CURRENT_DATE - INTERVAL '7 days' AND "createdAt" < CURRENT_DATE)::int AS current_week_count,
          COUNT(*) FILTER(WHERE "createdAt" >= CURRENT_DATE - INTERVAL '14 days' AND "createdAt" < CURRENT_DATE - INTERVAL '7 days')::int AS previous_week_count
        FROM "Article"
        WHERE "createdAt" >= CURRENT_DATE - INTERVAL '14 days' AND "createdAt" < CURRENT_DATE
      )

      SELECT
        total_count,
        current_week_count,
        previous_week_count,
        COALESCE((current_week_count - previous_week_count) * 100.0 / NULLIF(COALESCE(previous_week_count, 0), 0), 100) AS growth_rate
      FROM week_counts;
    `;

    const weekOfAskedLastAndThisWeekPersent = await this.prismaClient.$queryRaw`
      WITH week_counts AS (
        SELECT
          COUNT(*)::int AS total_count,
          COUNT(*) FILTER(WHERE "createdAt" >= CURRENT_DATE - INTERVAL '7 days' AND "createdAt" < CURRENT_DATE)::int AS current_week_count,
          COUNT(*) FILTER(WHERE "createdAt" >= CURRENT_DATE - INTERVAL '14 days' AND "createdAt" < CURRENT_DATE - INTERVAL '7 days')::int AS previous_week_count
        FROM "Asked"
        WHERE "createdAt" >= CURRENT_DATE - INTERVAL '14 days' AND "createdAt" < CURRENT_DATE
      )

      SELECT
        total_count,
        current_week_count,
        previous_week_count,
        COALESCE((current_week_count - previous_week_count) * 100.0 / NULLIF(COALESCE(previous_week_count, 0), 0), 100) AS growth_rate
      FROM week_counts;
    `;

    const totalUserCount = await this.users.count();
    const totalArticleCount = await this.article.count();
    const totalAskedCount = await this.asked.count();

    return {
      asked: {
        total: totalAskedCount,
        last2week: weekOfAskedLastAndThisWeekPersent[0],
      },
      article: {
        total: totalArticleCount,
        last2week: weekOfArticleLastAndThisWeekPersent[0],
      },
      user: {
        total: totalUserCount,
        last2week: weekOfUserLastAndThisWeekPersent[0],
      },
    };
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

  public getVerifyRequests = async (
    page: string,
  ): Promise<{
    contents: Array<UserSchoolVerify & { user: Pick<User, 'name' | 'id'> }>;
    totalPage: number;
  }> => {
    const requests = await this.userSchoolVerify.findMany({
      skip: isNaN(Number(page)) ? 0 : (Number(page) - 1) * 25,
      take: 25,
      include: {
        user: {
          select: {
            name: true,
            id: true,
          },
        },
        image: true,
      },
    });

    const totalRequests = await this.userSchoolVerify.count();

    return {
      contents: requests,
      totalPage: Math.ceil(totalRequests / 25),
    };
  };

  public postVerifyRequest = async (requestId: string, message: string, process: Process): Promise<boolean> => {
    if (process === Process.pending) throw new HttpException(409, '올바른 상태를 입력해주세요.');
    const findRequest = await this.userSchoolVerify.findUnique({ where: { id: requestId }, include: { user: true } });
    if (!findRequest) throw new HttpException(409, '해당 요청을 찾을 수 없습니다.');
    if (findRequest.process !== Process.pending) throw new HttpException(409, '이미 처리된 요청입니다.');

    const schoolInfo = await this.schoolService.getSchoolInfoById(findRequest.schoolId);
    if (!schoolInfo) throw new HttpException(409, '해당 학교를 찾을 수 없습니다.');

    if (process === Process.denied) {
      const updateVerify = await this.userSchoolVerify.update({
        where: { id: findRequest.id },
        data: {
          message: message,
          process: process,
        },
      });

      await this.sendPushNotification(findRequest.userId, '😢 인증이 거절되었어요!', `${schoolInfo.defaultName} 학생 인증이 거절되었습니다.`, {
        type: 'resetstack',
        url: '/verify',
      });

      await sendWebhook({
        type: WebhookType.VerifyReject,
        data: updateVerify,
      });

      try {
        await this.sendMessage('VERIFY_SCHOOL_REJECT', findRequest.user.phone, {
          '#{접속링크}': 'schoolmate.kr/verfiy',
          '#{학교이름}': findRequest.schoolName,
          '#{학년}': findRequest.grade + '학년',
          '#{사유}': message,
        });
      } catch (error) {
        logger.error(error);
      }

      return false;
    }
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

    try {
      await this.sendPushNotification(findRequest.userId, '🎉 축하합니다!', `${schoolInfo.defaultName} 학생 인증이 완료되었어요!`, {
        type: 'resetstack',
        url: '/me',
      });
    } catch (error) {
      logger.error(error);
    }

    try {
      await this.sendMessage('VERIFY_SCHOOL_APPROVE', isUserSchool.phone, {
        '#{접속링크}': '/me',
        '#{학교이름}': schoolInfo.defaultName,
        '#{학년}': findRequest.grade + '학년',
      });
    } catch (error) {
      logger.error(error);
    }

    await sendWebhook({
      type: WebhookType.VerifyAccept,
      data: findRequest,
    });
    return true;
  };

  public getBoardRequests = async (
    page: string,
  ): Promise<{
    contents: Array<BoardRequest & { user: Pick<User, 'name' | 'id'> }>;
    totalPage: number;
  }> => {
    const requests = await this.boardRequest.findMany({
      skip: isNaN(Number(page)) ? 0 : (Number(page) - 1) * 25,
      take: 25,
    });

    const totalRequests = await this.boardRequest.count();

    const boardRequestsWithUser = await Promise.all(
      requests.map(async request => {
        const user = await this.users.findUnique({
          where: { id: request.userId },
          select: {
            name: true,
            id: true,
          },
        });
        return {
          ...request,
          user: user,
        };
      }),
    );
    return {
      contents: boardRequestsWithUser,
      totalPage: Math.ceil(totalRequests / 25),
    };
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

    await sendWebhook({
      type: WebhookType.BoardComplete,
      data: updateRequest,
    });
    return updateRequest;
  };

  public getReports = async (process: string, targetType: ReportTargetType, page: string): Promise<{
    contents: Array<Report>;
    totalPage: number;
  }> => {
    const requests = await this.report.findMany({
      where: {
        process: processMap[process],
        targetType: targetType,
      },
      skip: isNaN(Number(page)) ? 0 : (Number(page) - 1) * 25,
      take: 25,
    });
    
    const totalRequests = await this.report.count({
      where: {
        process: processMap[process],
        targetType: targetType,
      },
    });

    return {
      contents: requests,
      totalPage: Math.ceil(totalRequests / 25),
    };
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

    await sendWebhook({
      type: WebhookType.ReportComplete,
      data: updateReport,
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

    const findArticle = await this.article.findUnique({
      where: { id: Number(articleId) },
      include: {
        user: true,
        board: true,
      },
    });
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

    await sendWebhook({
      type: WebhookType.ArticleDelete,
      data: findArticle,
    });
    return true;
  };

  public getUserInfo = async (userId: string): Promise<any> => {
    const findUser = await this.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        createdAt: true,
        profile: true,
        isVerified: true,
        userBlock: true,
        userSchool: {
          include: {
            school: true,
          },
        },
        askedUser: true,
        _count: {
          select: {
            article: true,
            comment: true,
            reComment: true,
            commentLike: true,
            reCommentLike: true,
            articleLike: true,
            asked: true,
          },
        },
      },
    });
    if (!findUser) throw new HttpException(409, '해당 유저를 찾을 수 없습니다.');

    return findUser;
  };

  public async getAllUsers(
    page: string,
    keyword: string,
  ): Promise<{
    contents: Array<any>;
    totalPage: number;
  }> {
    const users = await this.users.findMany({
      where: {
        OR: [
          {
            name: {
              contains: keyword,
            },
          },
          {
            phone: {
              contains: keyword,
            },
          },
          {
            userSchool: {
              school: {
                OR: [
                  {
                    name: {
                      contains: keyword,
                    },
                  },
                  {
                    defaultName: {
                      contains: keyword,
                    },
                  },
                ],
              },
            },
          },
        ],
      },
      select: {
        userSchool: {
          include: {
            school: true,
          },
        },
        id: true,
        name: true,
        phone: true,
        createdAt: true,
        email: true,
        isVerified: true,
      },
      skip: isNaN(Number(page)) ? 0 : (Number(page) - 1) * 25,
      take: 25,
    });

    const totalUsers = await this.users.count({
      where: {
        OR: [
          {
            name: {
              contains: keyword,
            },
          },
          {
            phone: {
              contains: keyword,
            },
          },
          {
            userSchool: {
              school: {
                name: {
                  contains: keyword,
                },
                defaultName: {
                  contains: keyword,
                },
              },
            },
          },
        ],
      },
    });

    return {
      contents: users,
      totalPage: Math.ceil(totalUsers / 25),
    };
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

  public async getAllSchools(
    page: string,
    keyword: string,
  ): Promise<{
    contents: Array<School>;
    totalPage: number;
  }> {
    // schools list with relation user count pagination query
    const schoolsWithUser = (await this.prismaClient.$queryRaw`
      SELECT
        "School".*,
        COUNT("UserSchool"."userId") AS "userCount"
      FROM "School"
      LEFT JOIN "UserSchool" ON "UserSchool"."schoolId" = "School"."schoolId"
      WHERE "School"."name" LIKE ${keyword ? `%${keyword}%` : '%%'} OR "School"."defaultName" LIKE ${keyword ? `%${keyword}%` : '%%'}
      GROUP BY "School"."schoolId"
      ORDER BY "School"."schoolId" DESC
      OFFSET ${isNaN(Number(page)) ? 0 : (Number(page) - 1) * 25}
      LIMIT 25
    `) as Array<School & { userCount: number }>;

    const totalSchools = await this.school.count();

    return {
      contents: schoolsWithUser.map(school => {
        return {
          ...school,
          userCount: Number(school.userCount),
        };
      }),
      totalPage: Math.ceil(totalSchools / 25),
    };
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

  public async blockUser(admin: Admin, data: UserBlockDto): Promise<UserBlock> {
    const findUser = await this.users.findUnique({ where: { id: data.userId } });
    if (!findUser) throw new HttpException(409, '해당 유저를 찾을 수 없습니다.');

    const findUserBlock = await this.userBlock.findFirst({ where: { userId: data.userId, targetId: data.targetId } });
    if (findUserBlock) throw new HttpException(409, '이미 차단된 유저입니다.');

    const createUserBlock = await this.userBlock.create({
      data: {
        userId: data.userId,
        targetId: data.targetId,
        reason: data.reason,
        endDate: data.endDate,
        transactionAdminId: admin.id,
      },
    });

    return createUserBlock;
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
