import { HttpException } from '@/exceptions/HttpException';
import { Article, Board, Comment, PrismaClient, User, LikeType, BoardRequest } from '@prisma/client';
import { UserWithSchool } from '@/interfaces/auth.interface';
import { ArticleWithImage, IArticleQuery } from '@/interfaces/board.interface';
import { deleteImage } from '@/utils/multer';
import SchoolService from './school.service';
import { SendBoardRequestDto } from '@/dtos/board.dto';

class BoardService {
  public schoolService = new SchoolService();
  public article = new PrismaClient().article;
  public board = new PrismaClient().board;
  public boardRequest = new PrismaClient().boardRequest;
  public comment = new PrismaClient().comment;
  public image = new PrismaClient().image;
  public articleLike = new PrismaClient().articleLike;
  public commentLike = new PrismaClient().commentLike;
  public reCommentLike = new PrismaClient().reCommentLike;
  public manager = new PrismaClient().boardManager;
  public reComment = new PrismaClient().reComment;
  public school = new PrismaClient().school;
  public user = new PrismaClient().user;
  public defaultBoard = new PrismaClient().defaultBoard;

  public async getBoards(user: UserWithSchool): Promise<Board[]> {
    if (!user.userSchoolId) throw new HttpException(404, '학교 정보가 없습니다.');
    try {
      const findBoards = await this.board.findMany({
        where: {
          schoolId: user.userSchoolId,
        },
      });

      if (findBoards.length === 0) {
        const createBoards = await this.defaultBoard.findMany();
        await this.board.createMany({
          data: createBoards.map(board => {
            return {
              name: board.name,
              description: board.description,
              schoolId: user.userSchoolId,
              default: true,
            };
          }),
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

  public async searchCombine(keyword: string, user: UserWithSchool): Promise<Article[]> {
    try {
      const findArticles = await this.article.findMany({
        where: {
          schoolId: user.userSchoolId,
          OR: [
            {
              title: {
                contains: keyword,
              },
            },
            {
              content: {
                contains: keyword,
              },
            },
          ],
        },
        select: {
          id: true,
        },
      });

      const filteredArticles: ArticleWithImage[] = [];

      for await (const article of findArticles) {
        const filteredArticle = await this.getArticle(article.id.toString(), user);
        filteredArticles.push(filteredArticle);
      }

      return filteredArticles;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
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

  public async getSuggestArticles(user: User): Promise<ArticleWithImage[]> {
    try {
      const findArticle = await this.article.findMany({
        where: {
          schoolId: user.userSchoolId,
        },
        take: 100,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: true,
          articleLike: true,
          comment: true,
          reComment: true,
        },
      });

      if (findArticle.length === 0) {
        return [];
      }

      findArticle.sort((a, b) => {
        if (a.articleLike.length > b.articleLike.length) return -1;
        else if (a.articleLike.length < b.articleLike.length) return 1;
        else return 0;
      });

      const articlesWithImage = await Promise.all(
        findArticle.map(async article => {
          if (article.images.length === 0) {
            return {
              ...article,
              keyOfImages: [],
              commentCounts: article.comment.length + article.reComment.length,
              likeCounts: article.articleLike.filter(like => like.likeType === LikeType.like).length,
              disLikeCounts: article.articleLike.filter(like => like.likeType === LikeType.dislike).length,
            } as unknown as ArticleWithImage;
          }

          const keyOfImages = await Promise.all(
            article.images.map(async imageId => {
              const findImage = await this.image.findUnique({
                where: {
                  id: imageId,
                },
              });
              if (!findImage) return;
              return findImage.key;
            }),
          );

          return {
            ...article,
            keyOfImages: keyOfImages,
            commentCounts: article.comment.length + article.reComment.length,
            likeCounts: article.articleLike.filter(like => like.likeType === LikeType.like).length,
            disLikeCounts: article.articleLike.filter(like => like.likeType === LikeType.dislike).length,
          } as unknown as ArticleWithImage;
        }),
      );

      return articlesWithImage.map(article => {
        return {
          ...article,
          userId: null,
          isMe: article.userId === user.id,
          user: article.isAnonymous
            ? {
              name: '(익명)',
              id: null,
            }
            : {
              name: article.user.name,
              id: article.user.id,
            },
        };
      });
    } catch (error) {
      throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
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

  public async getArticle(articleId: string, user: User): Promise<ArticleWithImage> {
    try {
      const findArticle = await this.article.findUnique({
        where: {
          id: Number(articleId),
        },
        include: {
          user: true,
          board: true,
          articleLike: true,
          comment: true,
          reComment: true,
        },
      });
      if (!findArticle) throw new HttpException(404, '해당하는 게시글이 없습니다.');
      if (findArticle.board.schoolId !== user.userSchoolId) throw new HttpException(404, '해당 게시글을 볼 수 없습니다.');

      const likeCounts = findArticle.articleLike.filter(like => like.likeType === LikeType.like).length;

      const keyOfImages = await Promise.all(
        findArticle.images.map(async imageId => {
          const findImage = await this.image.findUnique({
            where: {
              id: imageId,
            },
          });
          if (!findImage) return;
          return findImage.key;
        }),
      );

      return {
        ...findArticle,
        keyOfImages: keyOfImages,
        likeCounts: likeCounts,
        disLikeCounts: findArticle.articleLike.length - likeCounts,
        commentCounts: findArticle.comment.length + findArticle.reComment.length,
        isMe: findArticle.userId === user.id,
        ...(findArticle.isAnonymous
          ? {
            user: null,
            userId: null,
          }
          : {
            user: {
              name: findArticle.user.name,
              id: findArticle.user.id,
            } as User,
          }),
      } as unknown as ArticleWithImage;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  }

  public async getBoardPage(boardId: string, page: string, user: User): Promise<{ articles: Article[]; totalPage: number }> {
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
          user: true,
          comment: true,
          reComment: true,
          articleLike: true,
        },
      });

      const articlesWithImage = await Promise.all(
        findArticles.map(async article => {
          if (article.images.length == 0) {
            return {
              ...article,
              keyOfImages: [],
              commentCounts: article.comment.length + article.reComment.length,
              likeCounts: article.articleLike.filter(like => like.likeType === LikeType.like).length,
              isMe: article.userId === user.id,
            };
          }

          const keyOfImages = await Promise.all(
            article.images.map(async imageId => {
              const findImage = await this.image.findUnique({
                where: {
                  id: imageId,
                },
              });
              if (!findImage) return;
              return findImage.key;
            }),
          );

          return {
            ...article,
            keyOfImages: keyOfImages,
            commentCounts: article.comment.length + article.reComment.length,
            likeCounts: article.articleLike.filter(like => like.likeType === LikeType.like).length,
            isMe: article.userId === user.id,
          };
        }),
      );

      const findArticlesCount = await this.article.count({
        where: {
          boardId: Number(boardId),
        },
      });

      return {
        articles: articlesWithImage.map(article => {
          return {
            ...article,
            userId: article.isAnonymous ? null : article.user.id,
            user: article.isAnonymous
              ? null
              : {
                ...article.user,
                password: undefined,
                phone: undefined,
              },
          } as Article;
        }),
        totalPage: Math.ceil(findArticlesCount / 10),
      };
    } catch (error) {
      throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
    }
  }

  public async sendBoardRequest(data: SendBoardRequestDto, user: User): Promise<BoardRequest> {
    if (!user.userSchoolId) throw new HttpException(404, '학교 정보가 없습니다.');

    const school = await this.schoolService.getSchoolInfoById(user.userSchoolId);
    if (!school) throw new HttpException(404, '학교 정보가 없습니다.');

    try {
      const boardRequestData = await this.boardRequest.create({
        data: {
          name: data.name,
          description: data.description,
          userId: user.id,
          schoolId: school.schoolId,
          schoolName: school.defaultName,
        },
      });

      return boardRequestData;
    } catch (error) {
      throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
    }
  }

  public async getComments(
    articleId: string,
    page: string,
    user: User,
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
              user: true,
            },
          },
          user: true,
        },
      });

      const findCommentsExcludeUser = await Promise.all(
        findComments.map(async comment => {
          const reCommentsExcludeUser =
            comment.recomments.length === 0
              ? []
              : await Promise.all(
                comment.recomments.map(async reComment => {
                  return {
                    ...reComment,
                    content: reComment.isDeleted ? '삭제된 댓글입니다.' : reComment.content,
                    userId: reComment.isAnonymous ? null : reComment.user.id,
                    isMe: reComment.userId === user.id,
                    user: reComment.isDeleted
                      ? {
                        name: '(삭제됨)',
                        id: null,
                      }
                      : reComment.isAnonymous
                        ? undefined
                        : { name: reComment.user.name, id: reComment.user.id },
                  };
                }),
              );

          return {
            ...comment,
            content: comment.isDeleted ? '삭제된 댓글입니다.' : comment.content,
            userId: comment.isAnonymous ? null : comment.user.id,
            isMe: comment.userId === user.id,
            user: comment.isDeleted
              ? {
                name: '(삭제됨)',
                id: null,
              }
              : comment.isAnonymous
                ? undefined
                : { name: comment.user.name, id: comment.user.id },
            recomments: reCommentsExcludeUser.sort((a, b) => {
              if (a.createdAt > b.createdAt) return 1;
              else if (a.createdAt < b.createdAt) return -1;
              else return 0;
            }),
          };
        }),
      );

      const findCommentsCount = await this.comment.count({
        where: {
          articleId: Number(articleId),
        },
      });

      return {
        comments: findCommentsExcludeUser.sort((a, b) => {
          if (a.createdAt > b.createdAt) return 1;
          else if (a.createdAt < b.createdAt) return -1;
          else return 0;
        }),
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

  public async likeArticle(articleId: string, userId: string, likeType: LikeType): Promise<any> {
    try {
      const findArticle = await this.article.findUnique({
        where: {
          id: Number(articleId),
        },
      });

      if (!findArticle) {
        throw new HttpException(404, '해당하는 게시글이 없습니다.');
      }
      const ArticleLike = await this.articleLike.findFirst({
        where: {
          userId: userId,
          articleId: findArticle.id,
        },
      });

      if (!ArticleLike) {
        const createArticleLike = await this.articleLike.create({
          data: {
            userId: userId,
            articleId: findArticle.id,
            likeType: likeType,
          },
        });

        return createArticleLike;
      }

      if (ArticleLike.likeType === likeType) {
        await this.articleLike.delete({
          where: {
            id: ArticleLike.id,
          },
        });

        return null;
      } else {
        const updateArticleLike = await this.articleLike.update({
          where: {
            id: ArticleLike.id,
          },
          data: {
            likeType: likeType === LikeType.like ? LikeType.dislike : LikeType.like,
          },
        });

        return updateArticleLike;
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  }

  public likeComment = async (commentId: string, userId: string, likeType: LikeType): Promise<any> => {
    try {
      const findComment = await this.comment.findUnique({
        where: {
          id: Number(commentId),
        },
      });

      if (!findComment) {
        throw new HttpException(404, '해당하는 댓글이 없습니다.');
      }

      const createCommentLike = await this.commentLike.create({
        data: {
          userId: userId,
          commentId: findComment.id,
          likeType: likeType,
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

  public likeReComment = async (reCommentId: string, userId: string, likeType: LikeType): Promise<any> => {
    try {
      const findReComment = await this.reComment.findUnique({
        where: {
          id: Number(reCommentId),
        },
      });

      if (!findReComment) {
        throw new HttpException(404, '해당하는 대댓글이 없습니다.');
      }

      const createReCommentLike = await this.reCommentLike.create({
        data: {
          userId: userId,
          recommentId: findReComment.id,
          likeType: likeType,
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

      const images = findArticle.images;

      if (images.length !== 0) {
        for await (const imageId of images) {
          const image = await this.image.findUnique({
            where: {
              id: imageId,
            },
          });
          await deleteImage(image.key);

          await this.image.delete({
            where: {
              id: imageId,
            },
          });
        }
      }

      await this.comment.deleteMany({
        where: {
          articleId: Number(articleId),
        },
      });

      await this.reComment.deleteMany({
        where: {
          articleId: Number(articleId),
        },
      });

      await this.articleLike.deleteMany({
        where: {
          articleId: findArticle.id,
        },
      });

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

      await this.comment.update({
        where: {
          id: Number(commentId),
        },
        data: {
          isDeleted: true,
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

      await this.reComment.update({
        where: {
          id: Number(reCommentId),
        },
        data: {
          isDeleted: true,
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

  public async getUserArticles(userId: string, page: string, user: User): Promise<ArticleWithImage[]> {
    try {
      const targetUser = await this.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (targetUser.userSchoolId !== user.userSchoolId) {
        throw new HttpException(403, '권한이 없습니다.');
      }

      const findArticles = await this.article.findMany({
        where: {
          userId: targetUser.id,
          ...(targetUser.id === user.id
            ? {}
            : {
              isAnonymous: false,
            }),
        },
        skip: page ? (Number(page) - 1) * 10 : 0,
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          comment: true,
          reComment: true,
          articleLike: true,
        },
      });

      const articlesWithImage = await Promise.all(
        findArticles.map(async article => {
          if (article.images.length === 0) {
            return {
              ...article,
              keyOfImages: [],
              commentCounts: article.comment.length + article.reComment.length,
              likeCounts: article.articleLike.filter(like => like.likeType === LikeType.like).length,
              disLikeCounts: article.articleLike.filter(like => like.likeType === LikeType.dislike).length,
            } as unknown as ArticleWithImage;
          }

          const keyOfImages = await Promise.all(
            article.images.map(async imageId => {
              const findImage = await this.image.findUnique({
                where: {
                  id: imageId,
                },
              });
              if (!findImage) return;
              return findImage.key;
            }),
          );

          return {
            ...article,
            keyOfImages: keyOfImages,
            commentCounts: article.comment.length + article.reComment.length,
            likeCounts: article.articleLike.filter(like => like.likeType === LikeType.like).length,
            disLikeCounts: article.articleLike.filter(like => like.likeType === LikeType.dislike).length,
          } as unknown as ArticleWithImage;
        }),
      );

      return articlesWithImage.map(article => {
        return {
          ...article,
          isMe: article.userId === user.id,
        };
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, error.message);
      }
    }
  }

  public async getUserLikes(userId: string, page: string, user: User): Promise<ArticleWithImage[]> {
    try {
      const targetUser = await this.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (targetUser.userSchoolId !== user.userSchoolId) {
        throw new HttpException(403, '권한이 없습니다.');
      }

      const findLikes = await this.articleLike.findMany({
        where: {
          userId: targetUser.id,
        },
        skip: page ? (Number(page) - 1) * 10 : 0,
        take: 10,
        select: {
          article: {
            include: {
              comment: true,
              reComment: true,
              articleLike: true,
            }
          }
        }
      });

      const articlesWithImage = await Promise.all(
        findLikes.map(async like => {
          if (like.article.images.length === 0) {
            return {
              ...like.article,
              keyOfImages: [],
              commentCounts: like.article.comment.length + like.article.reComment.length,
              likeCounts: like.article.articleLike.filter(like => like.likeType === LikeType.like).length,
              disLikeCounts: like.article.articleLike.filter(like => like.likeType === LikeType.dislike).length,
            } as unknown as ArticleWithImage;
          }

          const keyOfImages = await Promise.all(
            like.article.images.map(async imageId => {
              const findImage = await this.image.findUnique({
                where: {
                  id: imageId,
                },
              });
              if (!findImage) return;
              return findImage.key;
            }),
          );

          return {
            ...like.article,
            keyOfImages: keyOfImages,
            commentCounts: like.article.comment.length + like.article.reComment.length,
            likeCounts: like.article.articleLike.filter(like => like.likeType === LikeType.like).length,
            disLikeCounts: like.article.articleLike.filter(like => like.likeType === LikeType.dislike).length,
          } as unknown as ArticleWithImage;
        }),
      );

      return articlesWithImage.map(article => {
        return {
          ...article,
          isMe: article.userId === user.id,
        };
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, error.message);
      }
    }
  }

  public async getUserComments(userId: string, page: string, user: User): Promise<Comment[]> {
    try {
      const targetUser = await this.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (targetUser.userSchoolId !== user.userSchoolId) {
        throw new HttpException(403, '권한이 없습니다.');
      }

      const findComments = await this.comment.findMany({
        where: {
          userId: targetUser.id,
          ...(targetUser.id === user.id
            ? {}
            : {
              isAnonymous: false,
            }),
        },
        skip: page ? (Number(page) - 1) * 10 : 0,
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          article: true,
        }
      });

      return findComments;
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
