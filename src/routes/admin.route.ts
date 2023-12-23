import AdminController from '@/controllers/admin.controller';
import {
  AdminDto,
  CompleteReportDto,
  GetBoardRequestDto,
  GetReportRequestDto,
  GetVerifyRequestDto,
  AdminRequestDto,
  GetAllDto,
  SchoolNameDto,
} from '@/dtos/admin.dto';
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
    this.router.get(`${this.path}/logout`, adminMiddleware, this.adminController.logOut);
    this.router.get(`${this.path}/analytics`, adminMiddleware, this.adminController.getAnalytics);
    this.router.get(
      `${this.path}/users`,
      adminMiddleware,
      adminFlagMiddleware('USER_MANAGE'),
      validationMiddleware(GetAllDto, 'query'),
      this.adminController.getAllUsers,
    );
    this.router.get(`${this.path}/users/:userId`, adminMiddleware, adminFlagMiddleware('USER_MANAGE'), this.adminController.getUserInfo);
    this.router.get(
      `${this.path}/article/all`,
      adminMiddleware,
      adminFlagMiddleware('BOARD_MANAGE'),
      validationMiddleware(GetAllDto, 'query'),
      this.adminController.getAllArticles,
    );
    this.router.get(
      `${this.path}/school/all`,
      adminMiddleware,
      adminFlagMiddleware('USER_SCHOOL_REVIEWER'),
      validationMiddleware(GetAllDto, 'query'),
      this.adminController.getAllSchools,
    );
    this.router.get(
      `${this.path}/verify`,
      adminMiddleware,
      validationMiddleware(GetVerifyRequestDto, 'query'),
      adminFlagMiddleware('USER_SCHOOL_REVIEWER'),
      this.adminController.verifyRequests,
    );
    this.router.get(
      `${this.path}/report`,
      adminMiddleware,
      validationMiddleware(GetReportRequestDto, 'query'),
      adminFlagMiddleware('USER_REPORT_REVIEWER'),
      this.adminController.reports,
    );
    this.router.get(
      `${this.path}/boardrequest`,
      adminMiddleware,
      validationMiddleware(GetBoardRequestDto, 'query'),
      adminFlagMiddleware('BOARD_MANAGE'),
      this.adminController.boardRequests,
    );
    this.router.post(
      `${this.path}/signup`,
      validationMiddleware(AdminDto, 'body'),
      adminMiddleware,
      adminFlagMiddleware('SUPER_ADMIN'),
      this.adminController.signUp,
    );
    this.router.post(`${this.path}/login`, validationMiddleware(AdminDto, 'body'), this.adminController.login);
    this.router.post(
      `${this.path}/verify`,
      adminMiddleware,
      validationMiddleware(AdminRequestDto, 'body'),
      adminFlagMiddleware('USER_SCHOOL_REVIEWER'),
      this.adminController.postVerifyRequest,
    );
    this.router.post(
      `${this.path}/boardrequest`,
      adminMiddleware,
      validationMiddleware(AdminRequestDto, 'body'),
      adminFlagMiddleware('BOARD_MANAGE'),
      this.adminController.postBoardRequest,
    );
    this.router.post(
      `${this.path}/report`,
      adminMiddleware,
      validationMiddleware(CompleteReportDto, 'query'),
      adminFlagMiddleware('USER_REPORT_REVIEWER'),
      this.adminController.completeReport,
    );
    this.router.post(
      `${this.path}/school/:schoolId/name`,
      adminMiddleware,
      validationMiddleware(SchoolNameDto, 'body'),
      this.adminController.setSchoolName,
    );
    this.router.delete(
      `${this.path}/board/:boardId/article/:articleId`,
      adminMiddleware,
      adminFlagMiddleware('USER_MANAGE'),
      this.adminController.deleteBoardArticle,
    );
    this.router.delete(`${this.path}/image/:id`, adminMiddleware, adminFlagMiddleware('USER_MANAGE'), this.adminController.deleteImage);
  }
}

export default AdminRoute;
