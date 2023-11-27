import AdController from "@/controllers/ad.controller";
import { AdDto } from "@/dtos/ad.dto";
import { Routes } from "@/interfaces/routes.interface";
import adminMiddleware from "@/middlewares/admin.middleware";
import validationMiddleware from "@/middlewares/validation.middleware";
import { Router } from "express";

class AdRoute implements Routes {
  public path = '/ad';
  public router = Router();
  public adController = new AdController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, this.adController.getAd);
    this.router.post(`${this.path}`, adminMiddleware, validationMiddleware(AdDto, 'body'), this.adController.createAd);
    this.router.post(`${this.path}/:adId`, adminMiddleware, validationMiddleware(AdDto, 'body'), this.adController.updateAd);
    this.router.delete(`${this.path}/:adId`, adminMiddleware, this.adController.deleteAd);
  }
}

export default AdRoute;