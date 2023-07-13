import { ReportDto } from '@/dtos/report.dto';
import { HttpException } from '@/exceptions/HttpException';
import { PrismaClient, ReportTargetType, User } from '@prisma/client';
import { AxiosError } from 'axios';

class ReportService {
  public user = new PrismaClient().user;
  public article = new PrismaClient().article;
  public comment = new PrismaClient().comment;
  public report = new PrismaClient().report;
  public asked = new PrismaClient().asked;
  public reComment = new PrismaClient().reComment;

  public async postReport(user: User, data: ReportDto): Promise<any> {
    try {
      switch (data.targetType) {
        case ReportTargetType.user:
          const findUser = await this.user.findUnique({
            where: {
              id: data.targetId,
            },
          });
          if (!findUser) throw new HttpException(404, '찾을 수 없는 유저입니다.');
          break;
        case ReportTargetType.article:
          const findArticle = await this.article.findUnique({
            where: {
              id: Number(data.targetId),
            },
          });
          if (!findArticle) throw new HttpException(404, '찾을 수 없는 게시글입니다.');
          break;
        case ReportTargetType.asked:
          const findAsked = await this.asked.findUnique({
            where: {
              id: data.targetId,
            },
          });
          if (!findAsked) throw new HttpException(404, '찾을 수 없는 질문입니다.');
          break;
        case ReportTargetType.comment:
          const findComment = await this.comment.findUnique({
            where: {
              id: Number(data.targetId),
            },
          });
          if (!findComment) throw new HttpException(404, '찾을 수 없는 댓글입니다.');
          break;
        case ReportTargetType.recomment:
          const findReComment = await this.reComment.findUnique({
            where: {
              id: Number(data.targetId),
            },
          });
          if (!findReComment) throw new HttpException(404, '찾을 수 없는 대댓글입니다.');
          break;
        default:
          throw new HttpException(400, '잘못된 타겟 타입입니다.');
      }

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
}

export default ReportService;
