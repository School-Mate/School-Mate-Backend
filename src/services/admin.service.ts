import bcrypt from 'bcrypt';
import { sign } from 'jsonwebtoken';
import { DOMAIN, MESSAGE_FROM, SECRET_KEY, SOL_API_KEY, SOL_API_PFID, SOL_API_SECRET } from '@/config';
import { AdminDto, CompleteReportDto } from '@/dtos/admin.dto';
import { HttpException } from '@/exceptions/HttpException';
import { DataStoredInToken, TokenData } from '@/interfaces/auth.interface';
import { PushMessage, SMS_TEMPLATE_ID, SmsEvent } from '@/interfaces/admin.interface';
import { deleteImage } from '@/utils/multer';
import { excludeAdminPassword } from '@/utils/util';
import { Admin, Article, BoardRequest, Process, Report, ReportTargetType, School, User, UserSchoolVerify } from '@prisma/client';
import { SchoolService } from './school.service';
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
  private schoolService = Container.get(SchoolService);
  private prismaClient = Container.get(PrismaClientService);
  private admin = Container.get(PrismaClientService).admin;
  private article = Container.get(PrismaClientService).article;
  private board = Container.get(PrismaClientService).board;
  private boardRequest = Container.get(PrismaClientService).boardRequest;
  private deletedArticle = Container.get(PrismaClientService).deletedArticle;
  private deletedComment = Container.get(PrismaClientService).deletedComment;
  private deletedReComment = Container.get(PrismaClientService).deletedReComment;
  private image = Container.get(PrismaClientService).image;
  private report = Container.get(PrismaClientService).report;
  private users = Container.get(PrismaClientService).user;
  private userSchool = Container.get(PrismaClientService).userSchool;
  private userSchoolVerify = Container.get(PrismaClientService).userSchoolVerify;
  private userBlock = Container.get(PrismaClientService).userBlock;
  private asked = Container.get(PrismaClientService).asked;
  private school = Container.get(PrismaClientService).school;
  private comment = Container.get(PrismaClientService).comment;
  private recomment = Container.get(PrismaClientService).reComment;
  private expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });
  private messageService = new SolapiMessageService(SOL_API_KEY, SOL_API_SECRET);

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
      orderBy: {
        createdAt: 'desc',
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

      try {
        await this.sendPushNotification(findRequest.userId, '😢 인증이 거절되었어요!', `${schoolInfo.defaultName} 학생 인증이 거절되었습니다.`, {
          type: 'resetstack',
          url: '/verify',
        });

        await sendWebhook({
          type: WebhookType.VerifyReject,
          data: updateVerify,
        });
        
        await this.sendMessage('VERIFY_SCHOOL_REJECT', findRequest.user.phone, {
          '#{접속링크}': 'schoolmate.kr/verify',
          '#{학교이름}': findRequest.schoolName,
          '#{학년}': findRequest.grade + '학년',
          '#{사유}': message,
        });
      } catch (error) {
        logger.error(error);
      }

      return false;
    }

    const isUserSchool = await this.users.update({
      where: {
        id: findRequest.userId,
      },
      data: {
        userSchoolId: findRequest.schoolId,
        userSchool: {
          upsert: {
            update: {
              schoolId: schoolInfo.schoolId,
              dept: findRequest.dept,
              class: findRequest.class,
              grade: findRequest.grade,
              verified: true,
            },
            create: {
              schoolId: schoolInfo.schoolId,
              dept: findRequest.dept,
              class: findRequest.class,
              grade: findRequest.grade,
              verified: true,
            },
          },
        },
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
        type: 'openstack',
        url: '/me',
      });

      await this.sendMessage('VERIFY_SCHOOL_APPROVE', isUserSchool.phone, {
        '#{접속링크}': '/me',
        '#{학교이름}': schoolInfo.defaultName,
        '#{학년}': findRequest.grade + '학년',
      });

      await sendWebhook({
        type: WebhookType.VerifyAccept,
        data: findRequest,
      });
    } catch (error) {
      logger.error(error);
    }
    return true;
  };

  public getArticle = async (boardId: string, articleId: string): Promise<Article> => {
    const findArticle = await this.article.findUnique({
      where: { id: Number(articleId) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        board: true,
      },
    });
    if (!findArticle) throw new HttpException(409, '해당 게시글을 찾을 수 없습니다.');

    return findArticle;
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

  public getReports = async (
    process: string,
    targetType: ReportTargetType,
    page: string,
  ): Promise<{
    contents: Array<Report>;
    totalPage: number;
  }> => {
    const reports = await this.report.findMany({
      where: {
        process: Process[process],
        ...(targetType && { targetType: targetType }),
      },
      skip: isNaN(Number(page)) ? 0 : (Number(page) - 1) * 25,
      take: 25,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const reportWithDetail = await Promise.all(
      reports.map(async report => {
        const reportUser = await this.users.findUnique({
          where: { id: report.reportUserId },
          select: {
            name: true,
            id: true,
          },
        });
        const targetUser = await this.users.findUnique({
          where: { id: report.targetUserId },
          select: {
            name: true,
            id: true,
          },
        });

        if (report.targetType === ReportTargetType.article) {
          const article = await this.article.findUnique({
            where: { id: Number(report.targetId) },
          });
          return {
            ...report,
            reportUser: reportUser ? reportUser : null,
            targetUser: targetUser ? targetUser : null,
            target: article ? article : null,
          };
        } else if (report.targetType === ReportTargetType.comment) {
          const comment = await this.comment.findUnique({
            where: { id: Number(report.targetId) },
          });
          return {
            ...report,
            reportUser: reportUser ? reportUser : null,
            targetUser: targetUser ? targetUser : null,
            target: comment ? comment : null,
          };
        } else if (report.targetType === ReportTargetType.recomment) {
          const reComment = await this.recomment.findUnique({
            where: { id: Number(report.targetId) },
          });
          return {
            ...report,
            reportUser: reportUser ? reportUser : null,
            targetUser: targetUser ? targetUser : null,
            target: reComment ? reComment : null,
          };
        } else if (report.targetType === ReportTargetType.user) {
          const user = await this.users.findUnique({
            where: { id: report.targetId },
          });
          return {
            ...report,
            reportUser: reportUser ? reportUser : null,
            targetUser: targetUser ? targetUser : null,
            target: user ? user : null,
          };
        }
      }),
    );

    const totalRequests = await this.report.count({
      where: {
        process: Process[process],
        ...(targetType && { targetType: targetType }),
      },
    });

    return {
      contents: reportWithDetail as any,
      totalPage: Math.ceil(totalRequests / 25),
    };
  };

  public completeReport = async (reportId: string, data: CompleteReportDto, admin: Admin): Promise<Report> => {
    const findReport = await this.report.findUnique({ where: { id: reportId } });
    if (!findReport) throw new HttpException(409, '해당 신고를 찾을 수 없습니다.');

    const targetUser = await this.users.findUnique({ where: { id: findReport.targetUserId } });
    if (!targetUser) throw new HttpException(409, '해당 유저를 찾을 수 없습니다.');

    if (data.blockPeriod) {
      const target = await this.userBlock.findFirst({
        where: {
          userId: findReport.targetUserId,
          targetId: findReport.targetId,
          targetType: findReport.targetType,
        },
      });
      if (target) {
        await this.report.updateMany({
          where: {
            targetId: findReport.targetId,
            targetType: findReport.targetType,
          },
          data: {
            process: Process.success,
            message: data.reason,
          },
        });
        throw new HttpException(409, '동일한 신고에 대한 제재가 이미 존재합니다.');
      }

      if (findReport.targetType === ReportTargetType.article) {
        const article = await this.article.findUnique({
          where: { id: Number(findReport.targetId) },
        });
        if (article) {
          await this.deletedArticle.create({
            data: article,
          });
          await this.article.delete({ where: { id: Number(findReport.targetId) } });
        }
      } else if (findReport.targetType === ReportTargetType.comment) {
        const comment = await this.comment.findUnique({
          where: { id: Number(findReport.targetId) },
        });

        if (comment) {
          await this.deletedComment.create({
            data: comment,
          });
          await this.comment.delete({ where: { id: Number(findReport.targetId) } });
        }
      } else if (findReport.targetType === ReportTargetType.recomment) {
        const reComment = await this.recomment.findUnique({
          where: { id: Number(findReport.targetId) },
        });
        if (reComment) {
          await this.deletedReComment.create({
            data: reComment,
          });
          await this.recomment.delete({ where: { id: Number(findReport.targetId) } });
        }
      }

      const hasUserBlock = await this.userBlock.findFirst({
        where: {
          userId: findReport.targetUserId,
          endDate: {
            gt: new Date(),
          },
        },
        orderBy: {
          endDate: 'asc',
        },
      });

      await this.userBlock.create({
        data: {
          userId: findReport.targetUserId,
          targetId: findReport.targetId,
          targetType: findReport.targetType,
          reason: data.reason,
          startDate: hasUserBlock ? hasUserBlock.endDate : new Date(),
          endDate: dayjs(hasUserBlock.endDate).add(data.blockPeriod, 'day').toDate(),
          transactionAdminId: admin.id,
        },
      });
    }

    const updateReport = await this.report.updateMany({
      where: {
        targetId: findReport.targetId,
        targetType: findReport.targetType,
      },
      data: {
        process: Process.success,
        message: data.reason,
      },
    });

    await sendWebhook({
      type: WebhookType.ReportComplete,
      data: updateReport,
    });

    return findReport;
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
