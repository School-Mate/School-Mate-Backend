import BoardService from '@/services/board.service';
import ResponseWrapper from '@/utils/responseWarpper';
import { Response, NextFunction } from 'express';
import { RequestHandler } from '@/interfaces/routes.interface';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { IArticleQuery, IBoardRequestQuery } from '@/interfaces/board.interface';

class BoardController {
  public boardService = new BoardService();

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

  public getBoard = async (req: RequestHandler, res: Response, next: NextFunction) => {
    try {
      const boardId = req.params.boardId;
      const boardData = await this.boardService.getBoard(boardId);

      ResponseWrapper(req, res, {
        data: boardData,
      });
    } catch (error) {
      next(error);
    }
  };

  public getSuggestArticles = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const suggestArticles = await this.boardService.getSuggestArticles(user);

      ResponseWrapper(req, res, {
        data: suggestArticles,
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

  public getArticles = async (req: RequestHandler, res: Response, next: NextFunction) => {
    try {
      const articleData = await this.boardService.getArticles(req.params.boardId, req.query.page as string);

      ResponseWrapper(req, res, {
        data: articleData,
      });
    } catch (error) {
      next(error);
    }
  };

  public getArticle = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const articleData = await this.boardService.getArticle(req.params.boardId, req.params.articleId, req.user);

      ResponseWrapper(req, res, {
        data: articleData,
      });
    } catch (error) {
      next(error);
    }
  };

  public getComments = async (req: RequestHandler, res: Response, next: NextFunction) => {
    try {
      const commentData = await this.boardService.getComments(req.params.articleId, req.query.page as string);

      ResponseWrapper(req, res, {
        data: commentData,
      });
    } catch (error) {
      next(error);
    }
  };

  public sendBoardRequest = async (req: RequestHandler, res: Response, next: NextFunction) => {
    try {
      const boardRequestData = req.body as IBoardRequestQuery;
      await this.boardService.sendBoardRequest(boardRequestData);

      ResponseWrapper(req, res, {
        status: 201,
        message: '게시판 신청이 완료되었습니다.',
      });
    } catch (error) {
      next(error);
    }
  };

  public getComment = async (req: RequestHandler, res: Response, next: NextFunction) => {
    try {
      const commentData = await this.boardService.getComment(req.params.commentId);

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
      const likeArticleData = await this.boardService.likeArticle(articleId, user.id);

      ResponseWrapper(req, res, {
        data: likeArticleData,
      });
    } catch (error) {
      next(error);
    }
  };

  public disLikeArticle = async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const articleId = req.params.articleId;
      const user = req.user;
      const disLikeArticleData = await this.boardService.disLikeArticle(articleId, user.id);

      ResponseWrapper(req, res, {
        data: disLikeArticleData,
      });
    } catch (error) {
      next(error);
    }
  };

  public likeComment = async (req: RequestHandler, res: Response, next: NextFunction) => {
    try {
      const commentId = req.params.commentId;
      const userId = req.params.userId;
      const likeCommentData = await this.boardService.likeComment(commentId, userId);

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
      const disLikeCommentData = await this.boardService.disLikeComment(commentId, userId);

      ResponseWrapper(req, res, {
        data: disLikeCommentData,
      });
    } catch (error) {
      next(error);
    }
  };

  public likeReComment = async (req: RequestHandler, res: Response, next: NextFunction) => {
    try {
      const recommentId = req.params.recommentId;
      const userId = req.params.userId;
      const likeReCommentData = await this.boardService.likeReComment(recommentId, userId);

      ResponseWrapper(req, res, {
        data: likeReCommentData,
      });
    } catch (error) {
      next(error);
    }
  };

  public disLikeReComment = async (req: RequestHandler, res: Response, next: NextFunction) => {
    try {
      const recommentId = req.params.recommentId;
      const userId = req.params.userId;
      const disLikeReCommentData = await this.boardService.disLikeReComment(recommentId, userId);

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
      const userId = req.user.id;
      const deleteComment = await this.boardService.deleteComment(commentId, userId);

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
}

export default BoardController;
