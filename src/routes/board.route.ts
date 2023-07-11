import BoardController from '@/controllers/board.controller';
import { CommentDto } from '@/dtos/comment.dto';
import { Routes } from '@/interfaces/routes.interface';
import authMiddleware from '@/middlewares/auth.middleware';
import validationMiddleware from '@/middlewares/validation.middleware';
import { Router } from 'express';

class BoardRoute implements Routes {
  public path = '/board';
  public router = Router();
  public boardController = new BoardController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/:boardId`, authMiddleware, this.boardController.getBoard);
    this.router.post(`${this.path}/:boardId`, authMiddleware, this.boardController.postArticle);
    this.router.get(`${this.path}/article/:articleId`, authMiddleware, this.boardController.getArticle);
    this.router.post(
      `${this.path}/article/:articleId/comment`,
      authMiddleware,
      validationMiddleware(CommentDto, 'body'),
      this.boardController.getComment,
    );
    this.router.post(
      `${this.path}/article/:articleId/comment/:commentId/recomment`,
      authMiddleware,
      validationMiddleware(CommentDto, 'body'),
      this.boardController.postReComment,
    );
    this.router.post(`${this.path}/request`, this.boardController.sendBoardRequest);
  }
}

export default BoardRoute;
