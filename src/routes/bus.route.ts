import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import validationMiddleware from '@middlewares/validation.middleware';
import { SearchBusStationDto } from '@/dtos/bus.dto';
import BusController from '@/controllers/bus.controller';

class BusRoute implements Routes {
  public path = '/bus';
  public router = Router();
  public busController = new BusController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/search`, validationMiddleware(SearchBusStationDto, 'query'), this.busController.searchBusStation);
    this.router.get(`${this.path}/search/:schoolId`, this.busController.searchBusStationBySchoolId);
  }
}

export default BusRoute;
