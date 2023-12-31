import { INSTAGRAM_REDIRECT_URI, INSTAGRAM_CLIENT_KEY } from '@/config';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { FightService } from '@/services/fight.service';
import ResponseWrapper from '@/utils/responseWarpper';
import { NextFunction, Response } from 'express';
import { Container } from 'typedi';

class FightController {
  public fightService = Container.get(FightService);
  public fightList = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      const page = req.query.page as string;
      const fightData = await this.fightService.getFightList(user, page);

      ResponseWrapper(req, res, fightData);
    } catch (error) {
      next(error);
    }
  };

  public fightRegistration = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      const fightId = req.params.fightId;
      const fightData = await this.fightService.fightRegistration(fightId, user);

      ResponseWrapper(req, res, {
        data: fightData,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default FightController;
