import BoardController from '@/controllers/board.controller';
import { Routes } from '@/interfaces/routes.interface';
import { Router } from 'express';

class BoardRoute implements Routes {
  public path = '/board';
  public router = Router();
  public boardController = new BoardController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/:boardId`, this.boardController.getBoard);
  }
}

export default BoardRoute;
