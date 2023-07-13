import BoardController from '@/controllers/board.controller';
import { BoardDto, CommentDto } from '@/dtos/board.dto';
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
    this.router.get(`${this.path}`, authMiddleware, this.boardController.getBoards);
    this.router.get(`${this.path}/:boardId`, authMiddleware, this.boardController.getBoard);
    this.router.get(`${this.path}/article/:articleId`, authMiddleware, this.boardController.getArticle);
    this.router.post(`${this.path}/request`, authMiddleware, this.boardController.sendBoardRequest);
    this.router.post(`${this.path}/:boardId`, authMiddleware, validationMiddleware(BoardDto, 'body'), this.boardController.postArticle);
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
    this.router.post(`${this.path}/article/:articleId/like`, authMiddleware, this.boardController.likeArticle);
    this.router.post(`${this.path}/article/:articleId/disLike`, authMiddleware, this.boardController.disLikeArticle);
    this.router.post(`${this.path}/article/:articleId/comment/:commentId/like`, authMiddleware, this.boardController.likeComment);
    this.router.post(`${this.path}/article/:articleId/comment/:commentId/disLike`, authMiddleware, this.boardController.disLikeComment);
    this.router.post(
      `${this.path}/article/:articleId/comment/:commentId/recomment/:recommentId/like`,
      authMiddleware,
      this.boardController.likeReComment,
    );
    this.router.post(
      `${this.path}/article/:articleId/comment/:commentId/recomment/:recommentId/disLike`,
      authMiddleware,
      this.boardController.disLikeReComment,
    );
  }
}

export default BoardRoute;
