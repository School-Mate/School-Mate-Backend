import { AdminDto, PostBoardRequestDto, PostVerifyRequestDto } from '@/dtos/admin.dto';
import AdminService from '@/services/admin.service';
import ResponseWrapper from '@/utils/responseWarpper';
import { Admin } from '@prisma/client';
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
      const signUpAdminData: Admin = await this.adminService.signUp(adminData);

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
      const { cookie, findAdmin } = await this.adminService.login(adminData);

      res.setHeader('Set-Cookie', [cookie]);
      ResponseWrapper(req, res, { data: findAdmin });
    } catch (error) {
      next(error);
    }
  };

  public logOut = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminData: Admin = req.admin;
      const logOutAdminData: Admin = await this.adminService.logout(adminData);

      res.setHeader('Set-Cookie', [`Authorization=; Max-age=0; Path=/; HttpOnly; Domain=${DOMAIN};`]);
      ResponseWrapper(req, res, { data: logOutAdminData });
    } catch (error) {
      next(error);
    }
  };

  public deleteImage = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const deleteImage = await this.adminService.deleteImage(id);
      ResponseWrapper(req, res, { data: deleteImage });
    } catch (error) {
      next(error);
    }
  };

  public verifyRequests = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const verifyRequests = await this.adminService.getVerifyRequests(req.params.process);
      ResponseWrapper(req, res, { data: verifyRequests });
    } catch (error) {
      next(error);
    }
  };

  public postVerifyRequest = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = req.body as PostVerifyRequestDto;
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
      const data = req.body as PostBoardRequestDto;
      const boardRequest = await this.adminService.postBoardRequest(data.requestId, data.message, data.process);
      ResponseWrapper(req, res, { data: boardRequest });
    } catch (error) {
      next(error);
    }
  };

  public reportRequests = async (req: RequestWithAdmin, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reportRequests = await this.adminService.getReports(req.params.process);
      ResponseWrapper(req, res, { data: reportRequests });
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
}

export default AdminController;
