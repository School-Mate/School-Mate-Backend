import { HttpException } from '@/exceptions/HttpException';
import { Article, Board, Comment, PrismaClient, User, LikeType, BoardRequest } from '@prisma/client';
import { UserWithSchool } from '@/interfaces/auth.interface';
import { ArticleWithImage, CommentWithUser, IArticleQuery } from '@/interfaces/board.interface';
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
              default: true,
            },
            {
              name: '취미공유',
              description: '취미를 공유하는 게시판입니다.',
              schoolId: user.userSchoolId,
              default: true,
            },
            {
              name: '질문게시판',
              description: '질문을 할 수 있는 게시판입니다.',
              schoolId: user.userSchoolId,
              default: true,
            },
            {
              name: '새내기게시판',
              description: '새내기들을 위한 게시판입니다.',
              schoolId: user.userSchoolId,
              default: true,
            },
            {
              name: '연애고민해결',
              description: '연애고민을 해결해주는 게시판입니다.',
              schoolId: user.userSchoolId,
              default: true,
            },
            {
              name: '스터디게시판',
              description: '공부시간, 플레너 인증, 스터디정보를 공유하는 게시판입니다.',
              schoolId: user.userSchoolId,
              default: true,
            },
            {
              name: '졸업생게시판',
              description: '졸업생들을 위한 게시판입니다.',
              schoolId: user.userSchoolId,
              default: true,
            },
            {
              name: '내찍사게시판',
              description: '내가찍은사진을 올리는 게시판입니다.',
              schoolId: user.userSchoolId,
              default: true,
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
          ArticleLike: true,
          Comment: true,
          ReComment: true,
        },
      });

      if (findArticle.length === 0) {
        return [];
      }

      const articlesWithImage: ArticleWithImage[] = [];

      findArticle.sort((a, b) => {
        if (a.ArticleLike.length > b.ArticleLike.length) return -1;
        else if (a.ArticleLike.length < b.ArticleLike.length) return 1;
        else return 0;
      });

      for await (const article of findArticle) {
        if (article.images.length == 0) {
          articlesWithImage.push({
            ...article,
            keyOfImages: [],
            commentCounts: article.Comment.length + article.ReComment.length,
            likeCounts: article.ArticleLike.filter(like => like.likeType === LikeType.like).length,
            disLikeCounts: article.ArticleLike.filter(like => like.likeType === LikeType.dislike).length,
          } as unknown as ArticleWithImage);
          continue;
        }

        const keyOfImages: string[] = [];
        for await (const imageId of article.images) {
          const findImage = await this.image.findUnique({
            where: {
              id: imageId,
            },
          });
          if (!findImage) continue;
          keyOfImages.push(findImage.key);

          articlesWithImage.push({
            ...article,
            keyOfImages: keyOfImages,
            commentCounts: article.Comment.length + article.ReComment.length,
            likeCounts: article.ArticleLike.filter(like => like.likeType === LikeType.like).length,
            disLikeCounts: article.ArticleLike.filter(like => like.likeType === LikeType.dislike).length,
          } as unknown as ArticleWithImage);
        }
      }

      return articlesWithImage.map(article => {
        if (article.isAnonymous) {
          return {
            ...article,
            userId: null,
            isMe: article.userId === user.id,
            User: undefined,
          };
        } else {
          return {
            ...article,
            isMe: article.userId === user.id,
            User: {
              name: article.User.name,
              id: article.User.id,
            },
          };
        }
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
          Board: true,
          User: true,
        },
      });

      if (!findArticle) throw new HttpException(404, '해당하는 게시글이 없습니다.');

      if (findArticle.Board.schoolId !== user.userSchoolId) throw new HttpException(404, '해당 게시글을 볼 수 없습니다.');

      const keyOfImages: string[] = [];

      const likeCounts = await this.articleLike.count({
        where: {
          articleId: findArticle.id,
          likeType: LikeType.like,
        },
      });

      const disLikeCounts = await this.articleLike.count({
        where: {
          articleId: findArticle.id,
          likeType: LikeType.dislike,
        },
      });

      const commentCounts = await this.comment.count({
        where: {
          articleId: findArticle.id,
        },
      });
      const reCommentCounts = await this.reComment.count({
        where: {
          articleId: findArticle.id,
        },
      });

      for await (const imageId of findArticle.images) {
        const findImage = await this.image.findUnique({
          where: {
            id: imageId,
          },
        });
        if (!findImage) continue;
        keyOfImages.push(findImage.key);
      }
      return {
        ...findArticle,
        keyOfImages: keyOfImages,
        likeCounts: likeCounts,
        disLikeCounts: disLikeCounts,
        commentCounts: commentCounts + reCommentCounts,
        isMe: findArticle.userId === user.id,
        ...(findArticle.isAnonymous
          ? {
              User: null,
              userId: null,
            }
          : {
              User: {
                name: findArticle.User.name,
                id: findArticle.User.id,
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

  public async getArticles(boardId: string, page: string, user: User): Promise<{ articles: Article[]; totalPage: number }> {
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
        const commentCounts = await this.comment.count({
          where: {
            articleId: article.id,
          },
        });
        const reCommentCounts = await this.reComment.count({
          where: {
            articleId: article.id,
          },
        });
        const likeCounts = await this.articleLike.count({
          where: {
            articleId: article.id,
            likeType: LikeType.like,
          },
        });

        if (article.images.length == 0) {
          articlesWithImage.push({
            ...article,
            keyOfImages: [],
            commentCounts: reCommentCounts + commentCounts,
            likeCounts: likeCounts,
            isMe: article.userId === user.id,
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
          commentCounts: commentCounts + reCommentCounts,
          keyOfImages: ketOfImages,
          likeCounts: likeCounts,
          isMe: article.userId === user.id,
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
              User: true,
            },
          },
          User: true,
        },
      });

      const findCommentsExcludeUser: CommentWithUser[] = [];

      for await (const comment of findComments) {
        const reCommentsExcludeUser: CommentWithUser[] = [];
        if (comment.recomments.length != 0) {
          for await (const reComment of comment.recomments) {
            if (reComment.isAnonymous) {
              reCommentsExcludeUser.push({
                ...reComment,
                content: reComment.isDeleted ? '삭제된 댓글입니다.' : reComment.content,
                userId: null,
                isMe: reComment.userId === user.id,
                User: reComment.isDeleted
                  ? {
                      name: '(삭제됨)',
                      id: null,
                    }
                  : undefined,
              });
            } else {
              reCommentsExcludeUser.push({
                ...reComment,
                content: reComment.isDeleted ? '삭제된 댓글입니다.' : reComment.content,
                userId: reComment.isDeleted ? undefined : reComment.User.id,
                isMe: comment.userId === user.id,
                User: reComment.isDeleted
                  ? {
                      name: '(삭제됨)',
                      id: null,
                    }
                  : {
                      name: reComment.User.name,
                      id: reComment.User.id,
                    },
              });
            }
          }
        }

        if (comment.isAnonymous) {
          findCommentsExcludeUser.push({
            ...comment,
            content: comment.isDeleted ? '삭제된 댓글입니다.' : comment.content,
            userId: null,
            isMe: comment.userId === user.id,
            User: comment.isDeleted
              ? {
                  name: '(삭제됨)',
                  id: null,
                }
              : undefined,
            recomments: reCommentsExcludeUser.sort((a, b) => {
              if (a.createdAt > b.createdAt) return 1;
              else if (a.createdAt < b.createdAt) return -1;
              else return 0;
            }),
          });
        } else {
          findCommentsExcludeUser.push({
            ...comment,
            content: comment.isDeleted ? '삭제된 댓글입니다.' : comment.content,
            isMe: comment.userId === user.id,
            User: comment.isDeleted
              ? {
                  name: '(삭제됨)',
                  id: null,
                }
              : {
                  name: comment.User.name,
                  id: comment.User.id,
                },
            recomments: reCommentsExcludeUser.sort((a, b) => {
              if (a.createdAt > b.createdAt) return 1;
              else if (a.createdAt < b.createdAt) return -1;
              else return 0;
            }),
          });
        }
      }

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
            likeType: LikeType.like,
          },
        });

        return createArticleLike;
      }

      if (ArticleLike.likeType === LikeType.like) {
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
            likeType: LikeType.like,
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
            likeType: LikeType.dislike,
          },
        });

        return createArticleLike;
      }

      if (ArticleLike.likeType === LikeType.dislike) {
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
            likeType: LikeType.dislike,
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

      const createCommentLike = await this.commentLike.create({
        data: {
          userId: userId,
          commentId: findComment.id,
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

      const createCommentDislike = await this.commentLike.create({
        data: {
          userId: userId,
          commentId: findComment.id,
          likeType: LikeType.dislike,
        },
      });

      return createCommentDislike;
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

      const createReCommentLike = await this.reCommentLike.create({
        data: {
          userId: userId,
          recommentId: findReComment.id,
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

      const createRecommentDislike = await this.reCommentLike.create({
        data: {
          userId: userId,
          recommentId: findReComment.id,
          likeType: LikeType.dislike,
        },
      });

      return createRecommentDislike;
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
}

export default BoardService;
