import { HttpException } from '@/exceptions/HttpException';
import { Board, PrismaClient } from '@prisma/client';

class BoardService {
  public board = new PrismaClient().board;
  public manager = new PrismaClient().boardManager;
  public article = new PrismaClient().article;
  public boardRequest = new PrismaClient().boardRequest;

  public async getBoardInfo(boardId: string): Promise<Board> {
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
}

export default BoardService;
