import { VerifySchoolImageDto } from '@/dtos/school.dto';
import { RequestWithUser } from '@/interfaces/auth.interface';
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

  public getTimetable = async (req: RequestHandler, res: Response, next: NextFunction) => {
    try {
      const schoolId = Number(req.params.schoolId);
      const timetableData = await this.schoolService.getTimetable(schoolId, req.query as object as ITimetableQuery);

      ResponseWrapper(req, res, {
        data: timetableData,
      });
    } catch (error) {
      next(error);
    }
  };

  public verifySchoolImage = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const schoolImageId = await this.schoolService.verifySchoolImage(req.user, req.body as VerifySchoolImageDto);

      ResponseWrapper(req, res, {
        data: schoolImageId,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default SchoolController;
