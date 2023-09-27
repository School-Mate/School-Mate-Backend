import { Router } from 'express';

import { Routes } from '@interfaces/routes.interface';
import validationMiddleware from '@middlewares/validation.middleware';
import { GetMealDto, GetTimetableDto, SearchSchoolDto, SchoolVerifyDto } from '@/dtos/school.dto';
import SchoolController from '@/controllers/school.controller';
import authMiddleware from '@/middlewares/auth.middleware';

class SchoolRoute implements Routes {
  public path = '/school';
  public router = Router();
  public schoolController = new SchoolController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/search`, authMiddleware, validationMiddleware(SearchSchoolDto, 'query'), this.schoolController.searchSchool);
    this.router.get(`${this.path}/:schoolId`, authMiddleware, this.schoolController.getSchoolById);
    this.router.get(`${this.path}/:schoolId/meals`, authMiddleware, validationMiddleware(GetMealDto, 'query'), this.schoolController.getMeal);
    this.router.get(
      `${this.path}/:schoolId/timetable`,
      authMiddleware,
      validationMiddleware(GetTimetableDto, 'query'),
      this.schoolController.getTimetable,
    );
    this.router.get(`${this.path}/:schoolId/class`, authMiddleware, this.schoolController.getClassInfo);
    this.router.post(`${this.path}/verify`, authMiddleware, validationMiddleware(SchoolVerifyDto, 'body'), this.schoolController.requestSchoolVerify);
  }
}

export default SchoolRoute;
