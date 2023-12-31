import { RequestHandler } from '@/interfaces/routes.interface';
import { BusService } from '@/services/bus.service';
import ResponseWrapper from '@/utils/responseWarpper';
import { NextFunction, Response } from 'express';
import { Container } from 'typedi';

class BusController {
  public busService = Container.get(BusService);

  public searchBusStation = async (req: RequestHandler, res: Response, next: NextFunction) => {
    try {
      const busStationData = await this.busService.searchBusStation(req.query.long as string, req.query.lati as string);

      ResponseWrapper(req, res, {
        data: busStationData,
      });
    } catch (error) {
      next(error);
    }
  };

  public searchBusStationBySchoolId = async (req: RequestHandler, res: Response, next: NextFunction) => {
    try {
      const stationData = await this.busService.searchStationBySchoolId(req.params.schoolId);

      ResponseWrapper(req, res, {
        data: stationData,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default BusController;
