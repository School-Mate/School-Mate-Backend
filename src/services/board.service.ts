import { HttpException } from '@/exceptions/HttpException';
import { Article, Board, PrismaClient } from '@prisma/client';

class BoardService {
  public board = new PrismaClient().board;
  public manager = new PrismaClient().boardManager;
  public article = new PrismaClient().article;
  public boardRequest = new PrismaClient().boardRequest;

  public async getBoard(boardId: string): Promise<Board> {
    try {
      const findBoard = await this.board.findUnique({
        where: {
          id: boardId as any as number,
        },
      });

      if (!findBoard) {
        throw new HttpException(404, '해당하는 게시판이 없습니다.');
      }

      return findBoard;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  }

  public async postArticle(boardId: string, data: IArticleQuery): Promise<void> {
    try {
      const findBoard = await this.board.findUnique({
        where: {
          id: Number(boardId) as number,
        },
      });
      if (!findBoard) throw new HttpException(404, '해당하는 게시판이 없습니다.');

      await this.article.create({
        data: {
          schoolId: findBoard.schoolId,
          title: data.title,
          content: data.content,
          images: data.images,
          isAnonymous: data.isAnonymous,
          userId: data.userId,
          boardId: Number(boardId) as number,
        },
      });
    } catch (error) {
      throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
    }
  }

  public async getArticle(articleId: string): Promise<Article> {
    try {
      const findArticle = await this.article.findUnique({
        where: {
          id: articleId as any as number,
        },
      });

      if (!findArticle) {
        throw new HttpException(404, '해당하는 게시글이 없습니다.');
      }

      return findArticle;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  }

  public async sendBoardRequest(data: IBoardRequestQuery): Promise<void> {
    try {
      await this.boardRequest.create({
        data: {
          name: data.name,
          description: data.description,
          detail: data.detail,
          userId: data.userId,
        },
      });
    } catch (error) {
      throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
    }
  }
}

export default BoardService;
