import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import FightController from '@/controllers/fight.controller';
import authMiddleware from '@/middlewares/auth.middleware';
import validationMiddleware from '@/middlewares/validation.middleware';
import { FightSearchQuery } from '@/dtos/fight.dto';

class FightRoute implements Routes {
  public path = '/fight';
  public router = Router();
  public fightController = new FightController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, validationMiddleware(FightSearchQuery, 'query'), authMiddleware, this.fightController.fightList);
    this.router.post(`${this.path}/:fightId/registration`, authMiddleware, this.fightController.fightRegistration);
  }
}

export default FightRoute;
