import BoardService from '@/services/board.service';
import ResponseWrapper from '@/utils/responseWarpper';
import { Response, NextFunction } from 'express';
import { RequestHandler } from '@/interfaces/routes.interface';

class BoardController {
  public boardService = new BoardService();

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
}

export default BoardController;
