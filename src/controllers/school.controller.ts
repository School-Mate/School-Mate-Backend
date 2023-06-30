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
}

export default SchoolController;
