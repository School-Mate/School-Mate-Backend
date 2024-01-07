import { BoardService } from '@/services/board.service';
import ResponseWrapper from '@/utils/responseWarpper';
import { Response, NextFunction } from 'express';
import { RequestHandler } from '@/interfaces/routes.interface';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { IArticleQuery } from '@/interfaces/board.interface';
import { SendBoardRequestDto } from '@/dtos/board.dto';
import { LikeType } from '@prisma/client';
import { Container } from 'typedi';

class BoardController {
  public boardService = Container.get(BoardService);

  public getBoards = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const boardData = await this.boardService.getBoards(req.user);

      ResponseWrapper(req, res, {
        data: boardData,
      });
    } catch (error) {
      next(error);
    }
  };

  public getBoard = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const boardId = req.params.boardId;
      const boardData = await this.boardService.getBoard(boardId, req.user);

      ResponseWrapper(req, res, {
        data: boardData,
      });
    } catch (error) {
      next(error);
    }
  };

  public searchCombine = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const searchData = await this.boardService.searchCombine(req.query.keyword as string, req.query.page as string, req.user);

      ResponseWrapper(req, res, {
        data: searchData,
      });
    } catch (error) {
      next(error);
    }
  };

  public getHotArticles = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const hotArticles = await this.boardService.getHotArticles(user, req.query.page as string);

      ResponseWrapper(req, res, {
        data: hotArticles,
      });
    } catch (error) {
      next(error);
    }
  };

  public postArticle = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const boardId = req.params.boardId;
      const articleData = req.body as IArticleQuery;
      const article = await this.boardService.postArticle(boardId, req.user, articleData);

      ResponseWrapper(req, res, {
        data: article,
      });
    } catch (error) {
      next(error);
    }
  };

  public getBoardPage = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const articleData = await this.boardService.getBoardPage(req.params.boardId, req.query.page as string, user);

      ResponseWrapper(req, res, {
        data: articleData,
      });
    } catch (error) {
      next(error);
    }
  };

  public getArticle = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const articleData = await this.boardService.getArticle(req.params.articleId, req.user);

      ResponseWrapper(req, res, {
        data: articleData,
      });
    } catch (error) {
      next(error);
    }
  };

  public getComments = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const commentData = await this.boardService.getComments(req.params.boardId, req.params.articleId, req.query.page as string, user);

      ResponseWrapper(req, res, {
        data: commentData,
      });
    } catch (error) {
      next(error);
    }
  };

  public sendBoardRequest = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const boardRequestData = req.body as SendBoardRequestDto;
      const requestBoard = await this.boardService.sendBoardRequest(boardRequestData, user);

      ResponseWrapper(req, res, { data: requestBoard });
    } catch (error) {
      next(error);
    }
  };

  public getComment = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const commentData = await this.boardService.getComment(req.params.commentId, req.user);

      ResponseWrapper(req, res, {
        data: commentData,
      });
    } catch (error) {
      next(error);
    }
  };

  public getReComment = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const commentData = await this.boardService.getReComment(req.user, req.params.commentId, req.params.reCommentId);

      ResponseWrapper(req, res, {
        data: commentData,
      });
    } catch (error) {
      next(error);
    }
  };

  public postComment = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const createdComment = await this.boardService.postComment(req.body, req.params.articleId, req.user);

      ResponseWrapper(req, res, {
        data: createdComment,
      });
    } catch (error) {
      next(error);
    }
  };

  public postReComment = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const createdComment = await this.boardService.postReComment(req.body, req.params.commentId, req.user);

      ResponseWrapper(req, res, {
        data: createdComment,
      });
    } catch (error) {
      next(error);
    }
  };

  public likeArticle = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const articleId = req.params.articleId;
      const user = req.user;
      const likeArticleData = await this.boardService.likeArticle(articleId, user, LikeType.like);

      ResponseWrapper(req, res, {
        data: likeArticleData,
        message: likeArticleData ? '공감을 표시했습니다' : '공감을 취소했습니다',
      });
    } catch (error) {
      next(error);
    }
  };

  public disLikeArticle = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const articleId = req.params.articleId;
      const user = req.user;
      const disLikeArticleData = await this.boardService.likeArticle(articleId, user, LikeType.dislike);

      ResponseWrapper(req, res, {
        data: disLikeArticleData,
      });
    } catch (error) {
      next(error);
    }
  };

  public likeComment = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const commentId = req.params.commentId;
      const userId = req.user.id;
      const likeCommentData = await this.boardService.likeComment(commentId, userId, LikeType.like);

      ResponseWrapper(req, res, {
        data: likeCommentData,
      });
    } catch (error) {
      next(error);
    }
  };

  public disLikeComment = async (req: RequestHandler, res: Response, next: NextFunction) => {
    try {
      const commentId = req.params.commentId;
      const userId = req.params.userId;
      const disLikeCommentData = await this.boardService.likeComment(commentId, userId, LikeType.dislike);

      ResponseWrapper(req, res, {
        data: disLikeCommentData,
      });
    } catch (error) {
      next(error);
    }
  };

  public likeReComment = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const recommentId = req.params.recommentId;
      const user = req.user;
      const likeReCommentData = await this.boardService.likeReComment(recommentId, user, LikeType.like);

      ResponseWrapper(req, res, {
        data: likeReCommentData,
      });
    } catch (error) {
      next(error);
    }
  };

  public disLikeReComment = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const recommentId = req.params.recommentId;
      const user = req.user;
      const disLikeReCommentData = await this.boardService.likeReComment(recommentId, user, LikeType.dislike);

      ResponseWrapper(req, res, {
        data: disLikeReCommentData,
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteArticle = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const articleId = req.params.articleId;
      const user = req.user;
      const deleteArticle = await this.boardService.deleteArticle(articleId, user.id);

      ResponseWrapper(req, res, {
        data: deleteArticle,
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteComment = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const commentId = req.params.commentId;
      const user = req.user;
      const deleteComment = await this.boardService.deleteComment(commentId, user);

      ResponseWrapper(req, res, {
        data: deleteComment,
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteReComment = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const recommentId = req.params.recommentId;
      const user = req.user;
      const deleteReComment = await this.boardService.deleteReComment(recommentId, user.id);

      ResponseWrapper(req, res, {
        data: deleteReComment,
      });
    } catch (error) {
      next(error);
    }
  };

  public getUserArticles = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const articleData = await this.boardService.getUserArticles(req.params.userId, req.query.page as string, user);

      ResponseWrapper(req, res, {
        data: articleData,
      });
    } catch (error) {
      next(error);
    }
  };

  public getUserLikes = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const articleData = await this.boardService.getUserLikes(req.params.userId, req.query.page as string, user);

      ResponseWrapper(req, res, {
        data: articleData,
      });
    } catch (error) {
      next(error);
    }
  };

  public getUserComments = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const articleData = await this.boardService.getUserComments(req.params.userId, req.query.page as string, user);

      ResponseWrapper(req, res, {
        data: articleData,
      });
    } catch (error) {
      next(error);
    }
  };

  public increaseViews = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const articleId = req.params.articleId;
      const increaseViews = await this.boardService.increaseViews(articleId);

      ResponseWrapper(req, res, {
        data: increaseViews,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default BoardController;
