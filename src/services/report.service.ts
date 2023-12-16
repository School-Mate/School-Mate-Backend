import { AxiosError } from 'axios';

import { ReportDto } from '@/dtos/report.dto';
import { HttpException } from '@/exceptions/HttpException';
import { PrismaClient, ReportTargetType, User } from '@prisma/client';
import { Service } from 'typedi';

@Service()
class ReportService {
  public user = new PrismaClient().user;
  public article = new PrismaClient().article;
  public comment = new PrismaClient().comment;
  public report = new PrismaClient().report;
  public asked = new PrismaClient().asked;
  public reComment = new PrismaClient().reComment;
  public reportBlindArticle = new PrismaClient().reportBlindArticle;
  public reportBlindUser = new PrismaClient().reportBlindUser;

  private targetTypes = {
    user: {
      model: this.user,
      notFoundMessage: '유저를 찾을 수 없습니다.',
    },
    article: {
      model: this.article,
      notFoundMessage: '게시글을 찾을 수 없습니다.',
    },
    asked: {
      model: this.asked,
      notFoundMessage: '질문을 찾을 수 없습니다.',
    },
    comment: {
      model: this.comment,
      notFoundMessage: '댓글을 찾을 수 없습니다.',
    },
    recomment: {
      model: this.reComment,
      notFoundMessage: '대댓글을 찾을 수 없습니다.',
    },
  };

  public async postReport(user: User, data: ReportDto): Promise<any> {
    try {
      const { model, notFoundMessage } = this.targetTypes[data.targetType];
      const targetId = /^\d+$/.test(data.targetId) ? Number(data.targetId) : data.targetId;

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      const findTarget = await model.findUnique({
        where: {
          id: targetId,
        },
      });
      if (!findTarget) throw new HttpException(404, notFoundMessage);

      const findUser = await this.user.findUnique({
        where: {
          id: user.id,
        },
      });

      const createReport = await this.report.create({
        data: {
          targetId: data.targetId,
          reportUserId: user.id,
          reportUserName: findUser.name,
          targetType: data.targetType,
          message: data.message,
        },
      });

      return createReport;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else if (error instanceof AxiosError) {
        throw new HttpException(500, '오류가 발생했습니다.');
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  }

  public async getReport(user: User, reportId: string): Promise<any> {
    const findReport = await this.report.findUnique({
      where: {
        id: reportId,
      },
    });

    if (!findReport) throw new HttpException(404, '신고를 찾을 수 없습니다.');
    if (user.id !== findReport.reportUserId) throw new HttpException(403, '권한이 없습니다.');

    return findReport;
  }

  public async postReportBlind(user: User, reportId: string): Promise<any> {
    const findReport = await this.report.findUnique({
      where: {
        id: reportId,
      },
    });

    if (!findReport) throw new HttpException(404, '신고를 찾을 수 없습니다.');
    if (user.id !== findReport.reportUserId) throw new HttpException(403, '권한이 없습니다.');

    if (findReport.targetType === ReportTargetType.article) {
      const isBlinded = await this.reportBlindArticle.findFirst({
        where: {
          userId: user.id,
          articleId: Number(findReport.targetId),
        },
      });
      if (isBlinded) throw new HttpException(400, '이미 블라인드된 게시글입니다.');
      const bliendedArticle = await this.reportBlindArticle.create({
        data: {
          articleId: Number(findReport.targetId),
          userId: user.id,
        },
      });

      return bliendedArticle;
    } else if (findReport.targetType === ReportTargetType.user) {
      const isBlinded = await this.reportBlindUser.findFirst({
        where: {
          targetUserId: findReport.targetId,
          userId: user.id,
        },
      });

      if (isBlinded) throw new HttpException(400, '이미 차단된 유저입니다.');

      const bliendUser = await this.reportBlindUser.create({
        data: {
          targetUserId: findReport.targetId,
          userId: user.id,
        },
      });

      return bliendUser;
    }

    throw new HttpException(400, '올바르지 않은 신고입니다.');
  }
}

export default ReportService;
