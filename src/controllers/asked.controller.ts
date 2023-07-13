import { AskedDto, AskedReceiveDto } from '@/dtos/asked.dto';
import AskedService from '@/services/asked.service';
import { RequestWithUser } from '@interfaces/auth.interface';
import ResponseWrapper from '@/utils/responseWarpper';
import { NextFunction, Response } from 'express';

class AskedController {
  public askedService = new AskedService();

  public getAskedUser = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.params.userId;
      const page = req.query.page as string;
      const askedUserData = await this.askedService.getAskedUser(userId, page);

      ResponseWrapper(req, res, { data: askedUserData });
    } catch (error) {
      next(error);
    }
  };

  public getAsked = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = req.query.page as string;
      const askedUserData = await this.askedService.getAsked(req.user, page);

      ResponseWrapper(req, res, { data: askedUserData });
    } catch (error) {
      next(error);
    }
  };

  public getAskedById = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const askedId = req.params.askedId;
      const askedUserData = await this.askedService.getAskedById(askedId);

      ResponseWrapper(req, res, { data: askedUserData });
    } catch (error) {
      next(error);
    }
  };

  public createAsked = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const questionData = req.body as AskedDto;
      const user = req.user; // 질문자
      const userId = req.params.userId; // 질문 대상자
      const askedData = await this.askedService.createAsked(user, userId, questionData);

      ResponseWrapper(req, res, { data: askedData });
    } catch (error) {
      next(error);
    }
  };

  public denyAsked = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const askedId = req.params.askedId;
      const askedData = await this.askedService.denyAsked(req.user, askedId);

      ResponseWrapper(req, res, { data: askedData });
    } catch (e) {
      next(e);
    }
  };

  public receiveAsked = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const askedId = req.params.askedId;
      const answerData = req.body as AskedReceiveDto;
      const askedData = await this.askedService.receiveAsked(req.user, askedId, answerData);

      ResponseWrapper(req, res, { data: askedData });
    } catch (error) {
      next(error);
    }
  };

  public deleteAsked = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const askedId = req.params.askedId;
      const askedData = await this.askedService.deleteAsked(req.user, askedId);

      ResponseWrapper(req, res, { data: askedData });
    } catch (error) {
      next(error);
    }
  };
}

export default AskedController;
