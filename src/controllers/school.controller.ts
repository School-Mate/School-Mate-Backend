import { NextFunction, Response } from 'express';

import { SchoolVerifyDto } from '@/dtos/school.dto';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { RequestHandler } from '@/interfaces/routes.interface';
import SchoolService from '@/services/school.service';
import ResponseWrapper from '@/utils/responseWarpper';

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
      const schoolData = await this.schoolService.getSchoolInfoById(req.params.schoolId);

      ResponseWrapper(req, res, {
        data: schoolData,
      });
    } catch (error) {
      next(error);
    }
  };

  public getMeal = async (req: RequestHandler, res: Response, next: NextFunction) => {
    try {
      const schoolId = req.params.schoolId;
      const mealData = await this.schoolService.getMeal(schoolId, req.query);

      ResponseWrapper(req, res, {
        data: mealData,
      });
    } catch (error) {
      next(error);
    }
  };

  public getTimetable = async (req: RequestHandler, res: Response, next: NextFunction) => {
    try {
      const timetableData = await this.schoolService.getTimetable(req.params.schoolId, req.query as object as ITimetableQuery);

      ResponseWrapper(req, res, {
        data: timetableData,
      });
    } catch (error) {
      next(error);
    }
  };

  public getClassInfo = async (req: RequestHandler, res: Response, next: NextFunction) => {
    try {
      const classInfoData = await this.schoolService.getClassInfo(req.params.schoolId);

      ResponseWrapper(req, res, {
        data: classInfoData,
      });
    } catch (error) {
      next(error);
    }
  };

  public requestSchoolVerify = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const schoolImageId = await this.schoolService.requestSchoolVerify(req.user, req.body as SchoolVerifyDto);

      ResponseWrapper(req, res, {
        data: schoolImageId,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default SchoolController;
