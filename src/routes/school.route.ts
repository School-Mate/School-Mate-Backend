import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import validationMiddleware from '@middlewares/validation.middleware';
import { GetMealDto, SearchSchoolDto, VerifySchoolImageDto } from '@/dtos/school.dto';
import SchoolController from '@/controllers/school.controller';

class SchoolRoute implements Routes {
  public path = '/school';
  public router = Router();
  public schoolController = new SchoolController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/search`, validationMiddleware(SearchSchoolDto, 'query'), this.schoolController.searchSchool);
    this.router.get(`${this.path}/:schoolId`, this.schoolController.getSchoolById);
    this.router.get(`${this.path}/:schoolId/meals`, validationMiddleware(GetMealDto, 'query'), this.schoolController.getMeal);
    this.router.get(`${this.path}/:schoolId/timetable`, validationMiddleware(GetMealDto, 'query'), this.schoolController.getTimetable);
    this.router.post(`${this.path}/verify`, this.schoolController.verifySchoolImage);
  }
}

export default SchoolRoute;
