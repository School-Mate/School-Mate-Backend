import { AdDto } from '@/dtos/ad.dto';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { AdService } from '@/services/ad.service';
import ResponseWrapper from '@/utils/responseWarpper';
import { NextFunction, Response } from 'express';
import { Container } from 'typedi';

class AdController {
  public adService = Container.get(AdService);

  public getAd = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const ad = await this.adService.getAd();

      ResponseWrapper(req, res, {
        data: ad,
      });
    } catch (error) {
      next(error);
    }
  };

  public createAd = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const adData = req.body as AdDto;
      const ad = await this.adService.createAd(adData);

      ResponseWrapper(req, res, {
        data: ad,
      });
    } catch (error) {
      next(error);
    }
  };

  public updateAd = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const adId = Number(req.params.adId);
      const adData = req.body as AdDto;
      const ad = await this.adService.updateAd(adId, adData);

      ResponseWrapper(req, res, {
        data: ad,
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteAd = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const adId = Number(req.params.adId);
      const ad = await this.adService.deleteAd(adId);

      ResponseWrapper(req, res, {
        data: ad,
      });
    } catch (error) {
      next(error);
    }
  };

  public increaseViews = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const adId = Number(req.params.adId);
      const ad = await this.adService.increaseViews(adId);

      ResponseWrapper(req, res, {
        data: ad,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default AdController;
