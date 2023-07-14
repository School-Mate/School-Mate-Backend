import AdminController from '@/controllers/admin.controller';
import { AdminDto, CompleteReportDto, GetBoardRequestDto, GetReportRequestDto, GetVerifyRequestDto, AdminRequestDto } from '@/dtos/admin.dto';
import { Routes } from '@/interfaces/routes.interface';
import adminMiddleware from '@/middlewares/admin.middleware';
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
    this.router.post(`${this.path}/signup`, validationMiddleware(AdminDto, 'body'), this.adminController.signUp);
    this.router.post(`${this.path}/login`, validationMiddleware(AdminDto, 'body'), this.adminController.login);
    this.router.get(`${this.path}/logout`, adminMiddleware, this.adminController.logOut);
    this.router.delete(`${this.path}/image/:id`, adminMiddleware, this.adminController.deleteImage);
    this.router.get(`${this.path}/verify`, adminMiddleware, validationMiddleware(GetVerifyRequestDto, 'query'), this.adminController.verifyRequests);
    this.router.post(`${this.path}/verify`, adminMiddleware, validationMiddleware(AdminRequestDto, 'body'), this.adminController.postVerifyRequest);
    this.router.get(`${this.path}/board`, adminMiddleware, validationMiddleware(GetBoardRequestDto, 'query'), this.adminController.boardRequests);
    this.router.post(`${this.path}/board`, adminMiddleware, validationMiddleware(AdminRequestDto, 'body'), this.adminController.postBoardRequest);
    this.router.get(`${this.path}/report`, adminMiddleware, validationMiddleware(GetReportRequestDto, 'query'), this.adminController.reports);
    this.router.post(`${this.path}/report`, adminMiddleware, validationMiddleware(CompleteReportDto, 'query'), this.adminController.completeReport);
    this.router.delete(`${this.path}/board/:boardId/article/:articleId`, adminMiddleware, this.adminController.deleteBoardArticle);
    this.router.get(`${this.path}/user/:userId`, adminMiddleware, this.adminController.getUserInfo);
  }
}

export default AdminRoute;
