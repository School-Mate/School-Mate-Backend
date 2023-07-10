import BoardController from '@/controllers/board.controller';
import { Routes } from '@/interfaces/routes.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import { Router } from 'express';

class BoardRoute implements Routes {
  public path = '/board';
  public router = Router();
  public boardController = new BoardController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, authMiddleware, this.boardController.getBoards);
    this.router.get(`${this.path}/:boardId`, authMiddleware, this.boardController.getBoard);
    this.router.post(`${this.path}/:boardId`, authMiddleware, this.boardController.postArticle);
    this.router.get(`${this.path}/article/:articleId`, authMiddleware, this.boardController.getArticle);
    this.router.post(`${this.path}/request`, authMiddleware, this.boardController.sendBoardRequest);
  }
}

export default BoardRoute;
