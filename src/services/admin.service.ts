import bcrypt from 'bcrypt';
import { sign } from 'jsonwebtoken';

import { DOMAIN, SECRET_KEY } from '@/config';
import { AdminDto } from '@/dtos/admin.dto';
import { HttpException } from '@/exceptions/HttpException';
import { DataStoredInToken, TokenData } from '@/interfaces/auth.interface';
import { deleteImage } from '@/utils/multer';
import { excludeAdminPassword } from '@/utils/util';
import { Admin, BoardRequest, PrismaClient, Process, Report, ReportTargetType, User, UserSchoolVerify } from '@prisma/client';
import SchoolService from './school.service';
import { processMap } from '@/utils/util';

class AdminService {
  public schoolService = new SchoolService();

  public admin = new PrismaClient().admin;
  public article = new PrismaClient().article;
  public board = new PrismaClient().board;
  public boardRequest = new PrismaClient().boardRequest;
  public deletedArticle = new PrismaClient().deletedArticle;
  public image = new PrismaClient().image;
  public report = new PrismaClient().report;
  public users = new PrismaClient().user;
  public userSchool = new PrismaClient().userSchool;
  public userSchoolVerify = new PrismaClient().userSchoolVerify;

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

    const deleteImageInfo = await this.image.delete({ where: { id: imageId } });
    try {
      await deleteImage(deleteImageInfo.key);
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

    await this.userSchoolVerify.update({
      where: { id: findRequest.id },
      data: {
        message: message,
        process: process,
      },
    });

    const schoolInfo = await this.schoolService.getSchoolInfoById(findRequest.schoolId);
    if (!schoolInfo) throw new HttpException(409, '해당 학교를 찾을 수 없습니다.');

    await this.userSchool.create({
      data: {
        userId: findRequest.userId,
        schoolId: schoolInfo.schoolId,
        dept: findRequest.dept,
        class: findRequest.class,
        grade: findRequest.grade,
      },
    });

    await this.users.update({
      where: { id: findRequest.userId },
      data: {
        userSchoolId: findRequest.schoolId,
      },
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

export default AdminService;
