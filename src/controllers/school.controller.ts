import { RequestHandler } from '@/interfaces/routes.interface';
import SchoolService from '@/services/school.service';
import ResponseWrapper from '@/utils/responseWarpper';
import { NextFunction, Response } from 'express';

class SchoolController {
  public schoolService = new SchoolService();

  public searchSchool = async (req: RequestHandler, res: Response, next: NextFunction) => {
    try {
      const schoolData = await this.schoolService.searchSchool(req.query.keyword as string);

      ResponseWrapper(req, res, {
        data: schoolData,
      });
    } catch (error) {
      next(error);
    }
  };

  public getSchoolById = async (req: RequestHandler, res: Response, next: NextFunction) => {
    try {
      const schoolId = Number(req.params.schoolId);
      const schoolData = await this.schoolService.getSchoolById(schoolId);

      ResponseWrapper(req, res, {
        data: schoolData,
      });
    } catch (error) {
      next(error);
    }
  };

  public getMeal = async (req: RequestHandler, res: Response, next: NextFunction) => {
    try {
      const schoolId = Number(req.params.schoolId);
      const mealData = await this.schoolService.getMeal(schoolId, req.query);

      ResponseWrapper(req, res, {
        data: mealData,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default SchoolController;
