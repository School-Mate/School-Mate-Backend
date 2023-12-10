import { AdminDto, GetVerifyRequestDto, AdminRequestDto } from '@/dtos/admin.dto';
import AdminService from '@/services/admin.service';
import ResponseWrapper from '@/utils/responseWarpper';
import { Admin, ReportTargetType } from '@prisma/client';
import { NextFunction, Response } from 'express';
import { RequestHandler } from '@/interfaces/routes.interface';
import { RequestWithAdmin } from '@/interfaces/admin.interface';
import { DOMAIN } from '@/config';

class AdminController {
  public adminService = new AdminService();

  public me = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminData: Admin = req.admin;

      ResponseWrapper(req, res, { data: adminData });
    } catch (error) {
      next(error);
    }
  };

  public signUp = async (req: RequestHandler, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminData = req.body as AdminDto;
      const signUpAdminData: Admin = await this.adminService.signUpService(adminData);

      ResponseWrapper(req, res, {
        data: signUpAdminData,
      });
    } catch (error) {
      next(error);
    }
  };

  public login = async (req: RequestHandler, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminData = req.body as AdminDto;
      const { cookie, findAdmin } = await this.adminService.loginService(adminData);

      res.setHeader('Set-Cookie', [cookie]);
      ResponseWrapper(req, res, { data: findAdmin });
    } catch (error) {
      next(error);
    }
  };

  public logOut = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminData: Admin = req.admin;
      const logOutAdminData: Admin = await this.adminService.logoutService(adminData);

      res.setHeader('Set-Cookie', [`Authorization=; Max-age=0; Path=/; HttpOnly; Domain=${DOMAIN};`]);
      ResponseWrapper(req, res, { data: logOutAdminData });
    } catch (error) {
      next(error);
    }
  };

  public deleteImage = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const deleteImage = await this.adminService.deleteImageService(id);
      ResponseWrapper(req, res, { data: deleteImage });
    } catch (error) {
      next(error);
    }
  };

  public verifyRequests = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const verifyRequests = await this.adminService.getVerifyRequests(req.query.process as GetVerifyRequestDto['process']);
      ResponseWrapper(req, res, { data: verifyRequests });
    } catch (error) {
      next(error);
    }
  };

  public postVerifyRequest = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = req.body as AdminRequestDto;
      const verifyRequest = await this.adminService.postVerifyRequest(data.requestId, data.message, data.process);
      ResponseWrapper(req, res, { data: verifyRequest });
    } catch (error) {
      next(error);
    }
  };

  public boardRequests = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const boardRequests = await this.adminService.getBoardRequests(req.params.process);
      ResponseWrapper(req, res, { data: boardRequests });
    } catch (error) {
      next(error);
    }
  };

  public postBoardRequest = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = req.body as AdminRequestDto;
      const boardRequest = await this.adminService.postBoardRequest(data.requestId, data.message, data.process);
      ResponseWrapper(req, res, { data: boardRequest });
    } catch (error) {
      next(error);
    }
  };

  public reports = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reports = await this.adminService.getReports(req.params.process, req.params.targetType as ReportTargetType);
      ResponseWrapper(req, res, { data: reports });
    } catch (error) {
      next(error);
    }
  };

  public deleteBoardArticle = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deleteBoardArticle = await this.adminService.deleteBoardArticle(req.params.boardId, req.params.articleId);
      ResponseWrapper(req, res, { data: deleteBoardArticle });
    } catch (error) {
      next(error);
    }
  };

  public completeReport = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const completeReport = await this.adminService.completeReport(req.params.reportId);
      ResponseWrapper(req, res, { data: completeReport });
    } catch (error) {
      next(error);
    }
  };

  public getUserInfo = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const getUserInfo = await this.adminService.getUserInfo(req.params.userId);
      ResponseWrapper(req, res, { data: getUserInfo });
    } catch (error) {
      next(error);
    }
  };

  public getAllUsers = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const getAllUsers = await this.adminService.getAllUsers(req.query.page as string);
      ResponseWrapper(req, res, { data: getAllUsers });
    } catch (error) {
      next(error);
    }
  };

  public getAllArticles = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const getAllArticles = await this.adminService.getAllArticles(req.query.page as string);
      ResponseWrapper(req, res, { data: getAllArticles });
    } catch (error) {
      next(error);
    }
  };

  public getAllSchools = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const getAllSchools = await this.adminService.getAllSchools(req.query.page as string);
      ResponseWrapper(req, res, { data: getAllSchools });
    } catch (error) {
      next(error);
    }
  };
}

export default AdminController;
