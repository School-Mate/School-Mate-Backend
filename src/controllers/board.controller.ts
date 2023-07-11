import BoardService from '@/services/board.service';
import ResponseWrapper from '@/utils/responseWarpper';
import { Response, NextFunction } from 'express';
import { RequestHandler } from '@/interfaces/routes.interface';
import { RequestWithUser } from '@/interfaces/auth.interface';

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

  public postArticle = async (req: RequestHandler, res: Response, next: NextFunction) => {
    try {
      const boardId = req.params.boardId;
      const articleData = req.body as IArticleQuery;
      await this.boardService.postArticle(boardId, articleData);

      ResponseWrapper(req, res, {
        status: 201,
        message: '게시글이 성공적으로 작성되었습니다.',
      });
    } catch (error) {
      next(error);
    }
  };

  public getArticle = async (req: RequestHandler, res: Response, next: NextFunction) => {
    try {
      const articleId = req.params.articleId;
      const articleData = await this.boardService.getArticle(articleId);

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
}

export default BoardController;