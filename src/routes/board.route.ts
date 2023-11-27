import BoardController from '@/controllers/board.controller';
import { BoardDto, CommentDto, SendBoardRequestDto, UserPageQuery } from '@/dtos/board.dto';
import { ArticleRequestQuery, SearchCombineDto } from '@/dtos/article.dto';
import { CommentRequestQuery } from '@/dtos/comment.dto';
import authMiddleware from '@/middlewares/auth.middleware';
import validationMiddleware from '@/middlewares/validation.middleware';
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
    this.router.get(`${this.path}`, authMiddleware, this.boardController.getBoards);
    this.router.get(`${this.path}/hot`, authMiddleware, this.boardController.getHotArticles);
    this.router.get(`${this.path}/search`, authMiddleware, validationMiddleware(SearchCombineDto, 'query'), this.boardController.searchCombine);
    this.router.get(`${this.path}/:boardId`, authMiddleware, this.boardController.getBoard);
    this.router.get(
      `${this.path}/:boardId/articles`,
      validationMiddleware(ArticleRequestQuery, 'query'),
      authMiddleware,
      this.boardController.getBoardPage,
    );
    this.router.get(`${this.path}/:boardId/article/:articleId`, authMiddleware, this.boardController.getArticle);
    this.router.get(
      `${this.path}/:boardId/article/:articleId/comments`,
      authMiddleware,
      validationMiddleware(CommentRequestQuery, 'query'),
      this.boardController.getComments,
    );
    this.router.get(`${this.path}/articles/:userId`, validationMiddleware(UserPageQuery, 'query'), this.boardController.getUserArticles);
    this.router.get(`${this.path}/likes/:userId`, validationMiddleware(UserPageQuery, 'query'), this.boardController.getUserLikes);
    this.router.get(`${this.path}/comments/:userId`, validationMiddleware(UserPageQuery, 'query'), this.boardController.getUserComments);
    this.router.post(
      `${this.path}/request`,
      authMiddleware,
      validationMiddleware(SendBoardRequestDto, 'body'),
      this.boardController.sendBoardRequest,
    );
    this.router.post(`${this.path}/:boardId`, authMiddleware, validationMiddleware(BoardDto, 'body'), this.boardController.postArticle);
    this.router.post(
      `${this.path}/article/:articleId/comment`,
      authMiddleware,
      validationMiddleware(CommentDto, 'body'),
      this.boardController.postComment,
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
    this.router.delete(`${this.path}/article/:articleId`, authMiddleware, this.boardController.deleteArticle);
    this.router.delete(`${this.path}/article/:articleId/comment/:commentId`, authMiddleware, this.boardController.deleteComment);
    this.router.delete(
      `${this.path}/article/:articleId/comment/:commentId/recomment/:recommentId`,
      authMiddleware,
      this.boardController.deleteReComment,
    );
  }
}

export default BoardRoute;
