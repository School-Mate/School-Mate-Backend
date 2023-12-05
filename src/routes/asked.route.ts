import AskedController from '@/controllers/asked.controller';
import { AskedCreateDto, AskedDto, AskedReceiveDto, AskedRequestQuery, AskedStatusMessageDto, AskedTagDto } from '@/dtos/asked.dto';
import { Routes } from '@/interfaces/routes.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import validationMiddleware from '@/middlewares/validation.middleware';
import { imageUpload } from '@/utils/multer';
import { Router } from 'express';

class AskedRoute implements Routes {
  public path = '/asked';
  public router = Router();
  public askedController = new AskedController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, authMiddleware, validationMiddleware(AskedRequestQuery, 'query'), this.askedController.getAsked);
    this.router.get(`${this.path}/:userId`, authMiddleware, validationMiddleware(AskedRequestQuery, 'query'), this.askedController.getAskedUser);
    this.router.get(`${this.path}/:userId/:askedId`, authMiddleware, this.askedController.getAskedById);
    this.router.get(`${this.path}/count`, authMiddleware, this.askedController.getAskedCount);
    this.router.post(`${this.path}/create`, authMiddleware, validationMiddleware(AskedCreateDto, 'body'), this.askedController.createAskedUser);
    this.router.post(
      `${this.path}/changestatusmessage`,
      authMiddleware,
      validationMiddleware(AskedStatusMessageDto, 'body'),
      this.askedController.changeStatusmessage,
    );
    this.router.post(`${this.path}/:userId`, authMiddleware, validationMiddleware(AskedDto, 'body'), this.askedController.createAsked);
    this.router.post(`${this.path}/:askedId/deny`, authMiddleware, this.askedController.denyAsked);
    this.router.post(`${this.path}/:askedId/reply`, authMiddleware, validationMiddleware(AskedReceiveDto, 'body'), this.askedController.receiveAsked);
    this.router.patch(`${this.path}/image`, authMiddleware, imageUpload.single('img'), this.askedController.updateImage);
    this.router.patch(`${this.path}/tag`, authMiddleware, validationMiddleware(AskedTagDto, 'body'), this.askedController.addTag);
    this.router.delete(`${this.path}/:askedId`, authMiddleware, this.askedController.deleteAsked);
    this.router.delete(`${this.path}/tag`, authMiddleware, this.askedController.removeTags);
  }
}

export default AskedRoute;
