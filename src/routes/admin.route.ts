import AdminController from '@/controllers/admin.controller';
import { AdminDto, CompleteReportDto, GetBoardRequestDto, GetReportRequestDto, GetVerifyRequestDto, AdminRequestDto } from '@/dtos/admin.dto';
import { Routes } from '@/interfaces/routes.interface';
import adminMiddleware, { adminFlagMiddleware } from '@/middlewares/admin.middleware';
import validationMiddleware from '@/middlewares/validation.middleware';
import { Router } from 'express';

class AdminRoute implements Routes {
  public path = '/admin';
  public router = Router();
  public adminController = new AdminController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/me`, adminMiddleware, this.adminController.me);
    this.router.post(
      `${this.path}/signup`,
      validationMiddleware(AdminDto, 'body'),
      adminMiddleware,
      adminFlagMiddleware('SUPER_ADMIN'),
      this.adminController.signUp,
    );
    this.router.post(`${this.path}/login`, validationMiddleware(AdminDto, 'body'), this.adminController.login);
    this.router.get(`${this.path}/logout`, adminMiddleware, this.adminController.logOut);
    this.router.delete(`${this.path}/image/:id`, adminMiddleware, adminFlagMiddleware('USER_MANAGE'), this.adminController.deleteImage);
    this.router.get(
      `${this.path}/verify`,
      adminMiddleware,
      validationMiddleware(GetVerifyRequestDto, 'query'),
      adminFlagMiddleware('USER_SCHOOL_REVIEWER'),
      this.adminController.verifyRequests,
    );
    this.router.post(
      `${this.path}/verify`,
      adminMiddleware,
      validationMiddleware(AdminRequestDto, 'body'),
      adminFlagMiddleware('USER_SCHOOL_REVIEWER'),
      this.adminController.postVerifyRequest,
    );
    this.router.get(
      `${this.path}/board`,
      adminMiddleware,
      validationMiddleware(GetBoardRequestDto, 'query'),
      adminFlagMiddleware('BOARD_MANAGE'),
      this.adminController.boardRequests,
    );
    this.router.post(
      `${this.path}/board`,
      adminMiddleware,
      validationMiddleware(AdminRequestDto, 'body'),
      adminFlagMiddleware('BOARD_MANAGE'),
      this.adminController.postBoardRequest,
    );
    this.router.get(
      `${this.path}/report`,
      adminMiddleware,
      validationMiddleware(GetReportRequestDto, 'query'),
      adminFlagMiddleware('USER_REPORT_REVIEWER'),
      this.adminController.reports,
    );
    this.router.post(
      `${this.path}/report`,
      adminMiddleware,
      validationMiddleware(CompleteReportDto, 'query'),
      adminFlagMiddleware('USER_REPORT_REVIEWER'),
      this.adminController.completeReport,
    );
    this.router.delete(
      `${this.path}/board/:boardId/article/:articleId`,
      adminMiddleware,
      adminFlagMiddleware('USER_MANAGE'),
      this.adminController.deleteBoardArticle,
    );
    this.router.get(`${this.path}/user/:userId`, adminMiddleware, adminFlagMiddleware('USER_MANAGE'), this.adminController.getUserInfo);
  }
}

export default AdminRoute;
