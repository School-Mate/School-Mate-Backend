import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import validationMiddleware from '@middlewares/validation.middleware';
import { SearchSchoolDto } from '@/dtos/school.dto';
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
  }
}

export default SchoolRoute;
