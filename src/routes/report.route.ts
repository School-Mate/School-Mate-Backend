import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import validationMiddleware from '@middlewares/validation.middleware';
import ReportController from '@/controllers/report.controller';
import authMiddleware from '@/middlewares/auth.middleware';
import { ReportDto } from '@/dtos/report.dto';

class ReportRoute implements Routes {
  public path = '/report';
  public router = Router();
  public reportController = new ReportController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/:reportId`, authMiddleware, this.reportController.getReport);
    this.router.post(`${this.path}`, authMiddleware, validationMiddleware(ReportDto, 'body'), this.reportController.postReport);
    this.router.post(`${this.path}/:reportId/blind`, authMiddleware, this.reportController.postBlind);
  }
}

export default ReportRoute;
