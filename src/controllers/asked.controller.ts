import { AskedCreateDto, AskedDto, AskedReceiveDto } from '@/dtos/asked.dto';
import { AskedService } from '@/services/asked.service';
import { RequestWithUser } from '@interfaces/auth.interface';
import ResponseWrapper from '@/utils/responseWarpper';
import { NextFunction, Response } from 'express';
import { Container } from 'typedi';

class AskedController {
  public askedService = Container.get(AskedService);

  public getAskedUser = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const targetUserId = req.params.userId;
      const user = req.user;
      const page = req.query.page as string;
      const askedUserData = await this.askedService.getAskedUser(targetUserId, page, user);

      ResponseWrapper(req, res, { data: askedUserData });
    } catch (error) {
      next(error);
    }
  };

  public createAskedUser = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const questionData = req.body as AskedCreateDto;
      const user = req.user;
      const askedData = await this.askedService.createAskedUser(user, questionData);

      ResponseWrapper(req, res, { data: askedData });
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

  public getAskedSearch = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = req.query.page as string;
      const keyword = req.query.keyword as string;
      const askedUserData = await this.askedService.getAskedSearch(req.user, page, keyword);

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

  public updateImage = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const askedData = await this.askedService.updateImage(req.user, req.file as Express.MulterS3.File);

      ResponseWrapper(req, res, { data: askedData });
    } catch (error) {
      next(error);
    }
  };

  public deleteImage = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const askedData = await this.askedService.deleteImage(req.user);

      ResponseWrapper(req, res, { data: askedData });
    } catch (error) {
      next(error);
    }
  };

  public changeStatusmessage = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const message = req.body.message as string;
      const askedData = await this.askedService.changeStatusmessage(req.user, message);

      ResponseWrapper(req, res, { data: askedData });
    } catch (error) {
      next(error);
    }
  };

  public addTag = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tag = req.body.tag;
      const askedData = await this.askedService.addTag(req.user, tag);

      ResponseWrapper(req, res, { data: askedData });
    } catch (error) {
      next(error);
    }
  };

  public removeTags = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const askedData = await this.askedService.removeTags(req.user);

      ResponseWrapper(req, res, { data: askedData });
    } catch (error) {
      next(error);
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

  public updateAsked = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const askedData = await this.askedService.updateAsked(req.user, req.body);

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

  public async getAskedCount(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const askedCount = await this.askedService.askedCount(req.user);

      ResponseWrapper(req, res, { data: askedCount });
    } catch (error) {
      next(error);
    }
  }

  public async updateAskedProfile(req: RequestWithUser, res: Response, next: NextFunction): Promise<void> {
    try {
      const askedData = await this.askedService.updateAskedProfile(req.user, req.file as Express.MulterS3.File);

      ResponseWrapper(req, res, { data: askedData });
    } catch (error) {
      next(error);
    }
  }
}

export default AskedController;
