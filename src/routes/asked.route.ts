import AskedController from '@/controllers/asked.controller';
import { AskedDto, AskedReceiveDto } from '@/dtos/asked.dto';
import { Routes } from '@/interfaces/routes.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import validationMiddleware from '@/middlewares/validation.middleware';
import { Router } from 'express';

class AskedRoute implements Routes {
  public path = '/asked';
  public router = Router();
  public askedController = new AskedController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, authMiddleware, this.askedController.getAsked);
    this.router.get(`${this.path}/:userId`, authMiddleware, this.askedController.getAskedUser);
    this.router.get(`${this.path}/:userId/:askedId`, authMiddleware, this.askedController.getAskedById);
    this.router.post(`${this.path}/:userId`, authMiddleware, validationMiddleware(AskedDto, 'body'), this.askedController.createAsked);
    this.router.post(`${this.path}/:userId/:askedId/deny`, authMiddleware, this.askedController.denyAsked);
    this.router.post(
      `${this.path}/:userId/:askedId/reply`,
      authMiddleware,
      validationMiddleware(AskedReceiveDto, 'body'),
      this.askedController.createAsked,
    );
  }
}

export default AskedRoute;
