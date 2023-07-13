import { HttpException } from '@/exceptions/HttpException';
import { Article, Board, Comment, PrismaClient, User, Like, LikeTargetType, LikeType } from '@prisma/client';
import { UserWithSchool } from '@/interfaces/auth.interface';
import { ArticleWithImage, CommentWithUser, IArticleQuery, IBoardRequestQuery } from '@/interfaces/board.interface';

class BoardService {
  public board = new PrismaClient().board;
  public manager = new PrismaClient().boardManager;
  public article = new PrismaClient().article;
  public boardRequest = new PrismaClient().boardRequest;
  public comment = new PrismaClient().comment;
  public reComment = new PrismaClient().reComment;
  public user = new PrismaClient().user;
  public image = new PrismaClient().image;
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

  public async postArticle(boardId: string, user: User, data: IArticleQuery): Promise<Article> {
    try {
      const findBoard = await this.board.findUnique({
        where: {
          id: Number(boardId),
        },
      });
      if (!findBoard) throw new HttpException(404, '해당하는 게시판이 없습니다.');

      const article = await this.article.create({
        data: {
          schoolId: findBoard.schoolId,
          title: data.title,
          content: data.content,
          images: data.images,
          isAnonymous: data.isAnonymous,
          userId: user.id,
          boardId: findBoard.id,
        },
      });

      return article;
    } catch (error) {
      throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
    }
  }

  public async getArticle(boardId: string, articleId: string, user: User): Promise<ArticleWithImage> {
    try {
      const findArticle = await this.article.findUnique({
        where: {
          id: Number(articleId),
        },
        include: {
          Board: true,
          User: true,
        },
      });

      if (!findArticle) throw new HttpException(404, '해당하는 게시글이 없습니다.');

      if (findArticle.Board.schoolId !== user.userSchoolId) throw new HttpException(404, '해당 게시글을 볼 수 없습니다.');

      const keyOfImages: string[] = [];

      for await (const imageId of findArticle.images) {
        const findImage = await this.image.findUnique({
          where: {
            id: imageId,
          },
        });
        if (!findImage) continue;
        keyOfImages.push(findImage.key);
      }

      if (findArticle.isAnonymous)
        return {
          ...findArticle,
          keyOfImages: keyOfImages,
          userId: null,
          User: undefined,
        } as unknown as ArticleWithImage;

      return {
        ...findArticle,
        keyOfImages: keyOfImages,
        User: {
          name: findArticle.User.name,
          id: findArticle.User.id,
        } as User,
      } as unknown as ArticleWithImage;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  }

  public async getArticles(boardId: string, page: string): Promise<{ articles: Article[]; totalPage: number }> {
    try {
      const findArticles = await this.article.findMany({
        where: {
          boardId: Number(boardId),
        },
        skip: page ? (Number(page) - 1) * 10 : 0,
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          User: true,
        },
      });

      const articlesWithImage: ArticleWithImage[] = [];

      for await (const article of findArticles) {
        if (article.images.length == 0) {
          articlesWithImage.push({
            ...article,
            keyOfImages: [],
          });
          continue;
        }

        const ketOfImages: string[] = [];

        for await (const imageId of article.images) {
          const findImage = await this.image.findUnique({
            where: {
              id: imageId,
            },
          });
          if (!findImage) continue;
          ketOfImages.push(findImage.key);
        }

        articlesWithImage.push({
          ...article,
          keyOfImages: ketOfImages,
        });
      }

      const findArticlesCount = await this.article.count({
        where: {
          boardId: Number(boardId),
        },
      });

      return {
        articles: articlesWithImage.map(article => {
          if (article.isAnonymous)
            return {
              ...article,
              userId: null,
              User: undefined,
            } as Article;
          else
            return {
              ...article,
              User: {
                ...article.User,
                password: undefined,
                phone: undefined,
              },
            };
        }),
        totalPage: Math.ceil(findArticlesCount / 10),
      };
    } catch (error) {
      throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
    }
  }

  public async sendBoardRequest(data: IBoardRequestQuery): Promise<void> {
    const userData = await this.user.findUnique({
      where: {
        id: data.userId,
      },
      include: {
        UserSchool: true,
      },
    });

    try {
      await this.boardRequest.create({
        data: {
          name: data.name,
          description: data.description,
          detail: data.detail,
          userId: data.userId,
          schoolId: userData.UserSchool.schoolId,
        },
      });
    } catch (error) {
      throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
    }
  }

  public async getComments(
    articleId: string,
    page: string,
  ): Promise<{
    comments: Comment[];
    totalPage: number;
  }> {
    try {
      const findComments = await this.comment.findMany({
        where: {
          articleId: Number(articleId),
        },
        skip: page ? (Number(page) - 1) * 10 : 0,
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          recomments: {
            include: {
              User: true,
            },
          },
          User: true,
        },
      });

      const findCommentsExcludAnUser: CommentWithUser[] = [];

      for await (const comment of findComments) {
        const reCommentsExcludAnUser: CommentWithUser[] = [];
        if (comment.recomments.length != 0) {
          for await (const reComment of comment.recomments) {
            if (reComment.isAnonymous) {
              console.log(reComment);
              reCommentsExcludAnUser.push({
                ...reComment,
                userId: null,
                User: undefined,
              });
            } else {
              reCommentsExcludAnUser.push({
                ...reComment,
                userId: reComment.User.id,
                User: {
                  name: reComment.User.name,
                  id: reComment.User.id,
                },
              });
            }
          }
        }

        if (comment.isAnonymous) {
          findCommentsExcludAnUser.push({
            ...comment,
            userId: null,
            User: undefined,
            recomments: reCommentsExcludAnUser,
          });
        } else {
          findCommentsExcludAnUser.push({
            ...comment,
            User: {
              name: comment.User.name,
              id: comment.User.id,
            },
            recomments: reCommentsExcludAnUser,
          });
        }
      }

      const findCommentsCount = await this.comment.count({
        where: {
          articleId: Number(articleId),
        },
      });

      return {
        comments: findCommentsExcludAnUser,
        totalPage: Math.ceil(findCommentsCount / 10),
      };
    } catch (e) {
      if (e instanceof HttpException) {
        throw e;
      }
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

  public async postComment(commentData: Comment, articleId: string, user: User): Promise<Comment> {
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
          userId: user.id,
        },
      });

      return createComment;
    } catch (error) {
      console.log(error);
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  }

  public async postReComment(reCommentData: Comment, commentId: string, user: User): Promise<Comment> {
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
          articleId: findComment.articleId,
          userId: user.id,
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

      const createArticledisLike = await this.like.create({
        data: {
          userId: userId,
          targetId: articleId,
          targetType: LikeTargetType.article,
          likeType: LikeType.dislike,
        },
      });

      return createArticledisLike;
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

      const createCommentdisLike = await this.like.create({
        data: {
          userId: userId,
          targetId: commentId,
          targetType: LikeTargetType.comment,
          likeType: LikeType.dislike,
        },
      });

      return createCommentdisLike;
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

      const createReCommentdisLike = await this.like.create({
        data: {
          userId: userId,
          targetId: reCommentId,
          targetType: LikeTargetType.recomment,
          likeType: LikeType.dislike,
        },
      });

      return createReCommentdisLike;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  public async deleteArticle(articleId: string, userId: string): Promise<any> {
    try {
      const findArticle = await this.article.findUnique({
        where: {
          id: Number(articleId),
        },
      });

      if (!findArticle) {
        throw new HttpException(404, '해당하는 게시글이 없습니다.');
      }

      if (findArticle.userId !== userId) {
        throw new HttpException(403, '권한이 없습니다.');
      }

      await this.article.delete({
        where: {
          id: Number(articleId),
        },
      });

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, error.message);
      }
    }
  }

  public async deleteComment(commentId: string, userId: string): Promise<any> {
    try {
      const findComment = await this.comment.findUnique({
        where: {
          id: Number(commentId),
        },
      });

      if (!findComment) {
        throw new HttpException(404, '해당하는 댓글이 없습니다.');
      }

      if (findComment.userId !== userId) {
        throw new HttpException(403, '권한이 없습니다.');
      }

      await this.comment.delete({
        where: {
          id: Number(commentId),
        },
      });

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, error.message);
      }
    }
  }

  public async deleteReComment(reCommentId: string, userId: string): Promise<any> {
    try {
      const findReComment = await this.reComment.findUnique({
        where: {
          id: Number(reCommentId),
        },
      });

      if (!findReComment) {
        throw new HttpException(404, '해당하는 대댓글이 없습니다.');
      }

      if (findReComment.userId !== userId) {
        throw new HttpException(403, '권한이 없습니다.');
      }

      await this.reComment.delete({
        where: {
          id: Number(reCommentId),
        },
      });

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, error.message);
      }
    }
  }
}

export default BoardService;
