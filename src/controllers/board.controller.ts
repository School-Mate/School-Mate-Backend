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

  public postComment = async (req: RequestHandler, res: Response, next: NextFunction) => {
    try {
      const createdComment = await this.boardService.postComment(req.body, req.params.articleId);

      ResponseWrapper(req, res, {
        data: createdComment,
      });
    } catch (error) {
      next(error);
    }
  };

  public postReComment = async (req: RequestHandler, res: Response, next: NextFunction) => {
    try {
      const createdComment = await this.boardService.postReComment(req.body, req.params.commentId);

      ResponseWrapper(req, res, {
        data: createdComment,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default BoardController;
