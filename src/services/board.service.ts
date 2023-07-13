import { HttpException } from '@/exceptions/HttpException';
import { Article, Board, Comment, Like, LikeTargetType, LikeType, PrismaClient } from '@prisma/client';
import { UserWithSchool } from '@/interfaces/auth.interface';

class BoardService {
  public board = new PrismaClient().board;
  public manager = new PrismaClient().boardManager;
  public article = new PrismaClient().article;
  public boardRequest = new PrismaClient().boardRequest;
  public comment = new PrismaClient().comment;
  public reComment = new PrismaClient().reComment;
  public user = new PrismaClient().user;
  public like = new PrismaClient().like;

  public async getBoards(user: UserWithSchool): Promise<Board[]> {
    if (!user.userSchoolId) throw new HttpException(404, '학교 정보가 없습니다.');
    try {
      const findBoards = await this.board.findMany({
        where: {
          schoolId: user.userSchoolId,
        },
      });

      if (findBoards.length === 0) {
        await this.board.createMany({
          data: [
            {
              name: '자유게시판',
              description: '자유롭게 글을 쓸 수 있는 게시판입니다.',
              schoolId: user.userSchoolId,
            },
            {
              name: '취미공유',
              description: '취미를 공유하는 게시판입니다.',
              schoolId: user.userSchoolId,
            },
            {
              name: '질문게시판',
              description: '질문을 할 수 있는 게시판입니다.',
              schoolId: user.userSchoolId,
            },
            {
              name: '새내기게시판',
              description: '새내기들을 위한 게시판입니다.',
              schoolId: user.userSchoolId,
            },
            {
              name: '연애고민해결',
              description: '연애고민을 해결해주는 게시판입니다.',
              schoolId: user.userSchoolId,
            },
            {
              name: '스터디게시판',
              description: '공부시간, 플레너 인증, 스터디정보를 공유하는 게시판입니다.',
              schoolId: user.userSchoolId,
            },
            {
              name: '졸업생게시판',
              description: '졸업생들을 위한 게시판입니다.',
              schoolId: user.userSchoolId,
            },
            {
              name: '내찍사게시판',
              description: '내가찍은사진을 올리는 게시판입니다.',
              schoolId: user.userSchoolId,
            },
          ],
        });

        const findBoards = await this.board.findMany({
          where: {
            schoolId: user.userSchoolId,
          },
        });

        return findBoards;
      }

      return findBoards;
    } catch (error) {
      throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
    }
  }

  public async getBoard(boardId: string): Promise<Board> {
    try {
      const findBoard = await this.board.findUnique({
        where: {
          id: Number(boardId),
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
          id: Number(boardId),
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
          boardId: Number(boardId),
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
          id: Number(articleId),
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

  public async getComment(commentId: string): Promise<Comment> {
    try {
      const findComment = await this.comment.findUnique({
        where: {
          id: Number(commentId),
        },
        include: {
          recomments: true,
        },
      });

      if (!findComment) {
        throw new HttpException(404, '해당하는 댓글이 없습니다.');
      }

      return findComment;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  }

  public async postComment(commentData: Comment, articleId: string): Promise<Comment> {
    try {
      const findArticle = await this.article.findUnique({
        where: {
          id: Number(articleId),
        },
      });

      if (!findArticle) {
        throw new HttpException(404, '해당하는 게시글이 없습니다.');
      }

      const createComment = await this.comment.create({
        data: {
          ...commentData,
          articleId: Number(articleId),
        },
      });

      return createComment;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  }

  public async postReComment(reCommentData: Comment, commentId: string): Promise<Comment> {
    try {
      const findComment = await this.comment.findUnique({
        where: {
          id: Number(commentId),
        },
      });

      if (!findComment) {
        throw new HttpException(404, '해당하는 댓글이 없습니다.');
      }

      const createReComment = await this.reComment.create({
        data: {
          ...reCommentData,
          commentId: Number(commentId),
        },
      });

      return createReComment;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  }

  public async likeArticle(articleId: string, userId: string): Promise<any> {
    try {
      const findArticle = await this.article.findUnique({
        where: {
          id: Number(articleId),
        },
      });

      if (!findArticle) {
        throw new HttpException(404, '해당하는 게시글이 없습니다.');
      }

      const createArticleLike = await this.like.create({
        data: {
          userId: userId,
          targetId: articleId,
          targetType: LikeTargetType.article,
          likeType: LikeType.like,
        },
      });

      return createArticleLike;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  }

  public disLikeArticle = async (articleId: string, userId: string): Promise<any> => {
    try {
      const findArticle = await this.article.findUnique({
        where: {
          id: Number(articleId),
        },
      });

      if (!findArticle) {
        throw new HttpException(404, '해당하는 게시글이 없습니다.');
      }

      const createArticleLike = await this.like.create({
        data: {
          userId: userId,
          targetId: articleId,
          targetType: LikeTargetType.article,
          likeType: LikeType.dislike,
        },
      });

      return createArticleLike;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  public likeComment = async (commentId: string, userId: string): Promise<any> => {
    try {
      const findComment = await this.comment.findUnique({
        where: {
          id: Number(commentId),
        },
      });

      if (!findComment) {
        throw new HttpException(404, '해당하는 댓글이 없습니다.');
      }

      const createCommentLike = await this.like.create({
        data: {
          userId: userId,
          targetId: commentId,
          targetType: LikeTargetType.comment,
          likeType: LikeType.like,
        },
      });

      return createCommentLike;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  public disLikeComment = async (commentId: string, userId: string): Promise<any> => {
    try {
      const findComment = await this.comment.findUnique({
        where: {
          id: Number(commentId),
        },
      });

      if (!findComment) {
        throw new HttpException(404, '해당하는 댓글이 없습니다.');
      }

      const createCommentLike = await this.like.create({
        data: {
          userId: userId,
          targetId: commentId,
          targetType: LikeTargetType.comment,
          likeType: LikeType.dislike,
        },
      });

      return createCommentLike;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  public likeReComment = async (reCommentId: string, userId: string): Promise<any> => {
    try {
      const findReComment = await this.reComment.findUnique({
        where: {
          id: Number(reCommentId),
        },
      });

      if (!findReComment) {
        throw new HttpException(404, '해당하는 대댓글이 없습니다.');
      }

      const createReCommentLike = await this.like.create({
        data: {
          userId: userId,
          targetId: reCommentId,
          targetType: LikeTargetType.recomment,
          likeType: LikeType.like,
        },
      });

      return createReCommentLike;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  public disLikeReComment = async (reCommentId: string, userId: string): Promise<any> => {
    try {
      const findReComment = await this.reComment.findUnique({
        where: {
          id: Number(reCommentId),
        },
      });

      if (!findReComment) {
        throw new HttpException(404, '해당하는 대댓글이 없습니다.');
      }

      const createReCommentLike = await this.like.create({
        data: {
          userId: userId,
          targetId: reCommentId,
          targetType: LikeTargetType.recomment,
          likeType: LikeType.dislike,
        },
      });

      return createReCommentLike;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  };
}

export default BoardService;
