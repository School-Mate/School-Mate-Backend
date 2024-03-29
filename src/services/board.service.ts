import { HttpException } from '@/exceptions/HttpException';
import { Article, Board, Comment, User, LikeType, BoardRequest, ReComment, BoardType } from '@prisma/client';
import { UserWithSchool } from '@/interfaces/auth.interface';
import { ArticleWithDetail, IArticleQuery } from '@/interfaces/board.interface';
import { deleteImage } from '@/utils/multer';
import { SchoolService } from './school.service';
import { SendBoardRequestDto } from '@/dtos/board.dto';
import { AdminService } from './admin.service';
import Container, { Service } from 'typedi';
import { PrismaClientService } from './prisma.service';
import { sendWebhook } from '@/utils/webhook';
import { WebhookType } from '@/types';
import eventEmitter from '@/utils/eventEmitter';

@Service()
export class BoardService {
  private schoolService = Container.get(SchoolService);
  private adminService = Container.get(AdminService);
  private article = Container.get(PrismaClientService).article;
  private board = Container.get(PrismaClientService).board;
  private boardRequest = Container.get(PrismaClientService).boardRequest;
  private comment = Container.get(PrismaClientService).comment;
  private image = Container.get(PrismaClientService).image;
  private articleLike = Container.get(PrismaClientService).articleLike;
  private commentLike = Container.get(PrismaClientService).commentLike;
  private reCommentLike = Container.get(PrismaClientService).reCommentLike;
  private reComment = Container.get(PrismaClientService).reComment;
  private user = Container.get(PrismaClientService).user;
  private defaultBoard = Container.get(PrismaClientService).defaultBoard;
  private hotArticle = Container.get(PrismaClientService).hotArticle;
  private deletedArticle = Container.get(PrismaClientService).deletedArticle;
  private blindArticle = Container.get(PrismaClientService).reportBlindArticle;
  private reportBlindUser = Container.get(PrismaClientService).reportBlindUser;

  public async getBoards(user: UserWithSchool): Promise<Board[]> {
    if (!user.userSchoolId) throw new HttpException(404, '학교 정보가 없습니다.');
    try {
      const boards: Board[] = [];
      const findBoards = await this.board.findMany({
        where: {
          schoolId: user.userSchoolId,
        },
      });

      const findSharedBoards = await this.board.findMany({
        where: {
          boardType: BoardType.share,
          OR: [
            {
              schoolId: user.userSchool.school.atptCode,
            },
            {
              schoolId: 'all',
            },
          ],
        },
      });

      if (findSharedBoards.filter(board => board.schoolId == 'all').length === 0) {
        await this.board.create({
          data: {
            name: '지역 게시판',
            description: '같은 지역의 학교들만 볼 수 있는 게시판입니다.',
            schoolId: user.userSchool.school.atptCode,
            boardType: BoardType.share,
          },
        });

        const findSharedBoards = await this.board.findMany({
          where: {
            schoolId: user.userSchool.school.atptCode,
          },
        });

        boards.push(...findSharedBoards);
      } else {
        boards.push(...findSharedBoards);
      }

      if (findBoards.length === 0) {
        const createBoards = await this.defaultBoard.findMany();
        await this.board.createMany({
          data: createBoards.map(board => {
            return {
              name: board.name,
              description: board.description,
              schoolId: user.userSchoolId,
              default: true,
              defaultBoardId: board.id,
            };
          }),
        });

        const findBoards = await this.board.findMany({
          where: {
            schoolId: user.userSchoolId,
          },
        });

        boards.push(...findBoards);
      } else {
        boards.push(...findBoards);
      }

      return boards;
    } catch (error) {
      throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
    }
  }

  public async searchCombine(keyword: string, page: string, user: UserWithSchool): Promise<Article[]> {
    try {
      const findArticles = await this.article.findMany({
        where: {
          OR: [
            {
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
            {
              schoolId: user.userSchool.school.atptCode,
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
            {
              schoolId: 'all',
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
          ],
        },
        select: {
          id: true,
        },
        skip: isNaN(Number(page)) ? 0 : (Number(page) - 1) * 10,
        take: 10,
      });

      const filteredArticles: ArticleWithDetail[] = [];

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

  public async getBoard(boardId: string, user: UserWithSchool): Promise<Board> {
    try {
      const findBoard = await this.board.findUnique({
        where: {
          id: Number(boardId),
        },
      });

      if (findBoard.boardType === BoardType.share && findBoard.schoolId !== user.userSchool.school.atptCode && findBoard.schoolId !== 'all') {
        new HttpException(404, '해당 게시판을 볼 권한이 없습니다.');
      }

      if (findBoard.boardType === BoardType.school && findBoard.schoolId !== user.userSchoolId) {
        throw new HttpException(404, '해당 게시판을 볼 권한이 없습니다.');
      }

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

  public async postArticle(boardId: string, user: UserWithSchool, data: IArticleQuery): Promise<Article> {
    try {
      const findBoard = await this.board.findUnique({
        where: {
          id: Number(boardId),
        },
      });
      if (!findBoard) throw new HttpException(404, '해당하는 게시판이 없습니다.');

      if (findBoard.boardType === BoardType.share && findBoard.schoolId !== user.userSchool.school.atptCode && findBoard.schoolId !== 'all') {
        throw new HttpException(404, '해당 게시판에 글을 작성할 수 없습니다.');
      }

      if (findBoard.boardType === BoardType.school && findBoard.schoolId !== user.userSchoolId) {
        throw new HttpException(404, '해당 게시판에 글을 작성할 수 없습니다.');
      }

      const images = await this.image.findMany({
        where: {
          id: {
            in: data.images,
          },
        },
      });

      const article = await this.article.create({
        data: {
          schoolId:
            findBoard.schoolId === 'all' ? 'all' : findBoard.boardType === BoardType.share ? user.userSchool.school.atptCode : user.userSchoolId,
          title: data.title,
          content: data.content,
          images: images.map(image => image.key),
          isAnonymous: data.isAnonymous,
          userId: user.id,
          boardId: findBoard.id,
        },
      });

      images.forEach(async image => {
        eventEmitter.emit('imageResize', image.key, 'article');
      });

      return article;
    } catch (error) {
      throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
    }
  }

  public async getArticle(articleId: string, user: UserWithSchool): Promise<ArticleWithDetail> {
    try {
      const findArticle = await this.article.findUnique({
        where: {
          id: Number(articleId),
        },
        include: {
          user: true,
          board: true,
        },
      });
      if (!findArticle) throw new HttpException(404, '해당하는 게시글이 없습니다.');
      if (
        findArticle.board.boardType === BoardType.share &&
        findArticle.board.schoolId != 'all' &&
        findArticle.board.schoolId !== user.userSchool.school.atptCode
      )
        throw new HttpException(404, '해당 게시글을 볼 수 없습니다.');
      if (findArticle.board.boardType === BoardType.school && findArticle.board.schoolId !== user.userSchoolId)
        throw new HttpException(404, '해당 게시글을 볼 수 없습니다.');

      const likeCounts = await this.articleLike.count({
        where: {
          articleId: findArticle.id,
          likeType: LikeType.like,
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

      return {
        ...findArticle,
        likeCounts: likeCounts,
        commentCounts: commentCounts + reCommentCounts,
        comments: await this.getComments(String(findArticle.boardId), articleId, '1', user),
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
                profile: findArticle.user.profile,
              } as User,
            }),
      } as unknown as ArticleWithDetail;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  }

  public async getBoardPage(
    boardId: string,
    page: string,
    user: UserWithSchool,
  ): Promise<{ contents: Article[]; totalPage: number; numberPage: number }> {
    try {
      const findBoard = await this.board.findUnique({
        where: {
          id: Number(boardId),
        },
      });

      if (!findBoard) throw new HttpException(404, '해당하는 게시판이 없습니다.');
      if (findBoard.boardType === BoardType.share && findBoard.schoolId != 'all' && findBoard.schoolId !== user.userSchool.school.atptCode)
        throw new HttpException(404, '해당 게시글을 볼 수 없습니다.');
      if (findBoard.boardType === BoardType.school && findBoard.schoolId !== user.userSchoolId)
        throw new HttpException(404, '해당 게시글을 볼 수 없습니다.');

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
          user: {
            select: {
              name: true,
              id: true,
              profile: true,
            },
          },
          comment: true,
          reComment: true,
          articleLike: true,
        },
      });

      const articlesWithImage = await Promise.all(
        findArticles.map(async article => {
          if (!article.isAnonymous) {
            const isBlindedUser = await this.reportBlindUser.findFirst({
              where: {
                targetUserId: article.userId,
                userId: user.id,
              },
            });
            if (isBlindedUser) return null;
          }
          const blindedArticle = await this.blindArticle.findFirst({
            where: {
              articleId: article.id,
              userId: user.id,
            },
          });

          if (blindedArticle) return null;

          return {
            ...article,
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
        contents: articlesWithImage
          .filter(article => article)
          .map(article => {
            return {
              ...article,
              userId: article.isAnonymous ? null : article.user.id,
              user: article.isAnonymous ? null : article.user,
            } as Article;
          }),
        totalPage: findArticlesCount === 0 ? 1 : Math.ceil(findArticlesCount / 10),
        numberPage: page ? Number(page) : 1,
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

      await sendWebhook({
        type: WebhookType.BoardRequest,
        data: boardRequestData,
      });
      return boardRequestData;
    } catch (error) {
      throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
    }
  }

  public async getComments(
    boardId: string,
    articleId: string,
    page: string,
    user: UserWithSchool,
  ): Promise<{
    contents: Comment[];
    totalPage: number;
    numberPage: number;
  }> {
    try {
      const findBoard = await this.board.findUnique({
        where: {
          id: Number(boardId),
        },
      });

      if (!findBoard) throw new HttpException(404, '해당하는 게시판이 없습니다.');
      if (findBoard.boardType === BoardType.share && findBoard.schoolId != 'all' && findBoard.schoolId !== user.userSchool.school.atptCode)
        throw new HttpException(404, '해당 게시글을 볼 수 없습니다.');
      if (findBoard.boardType === BoardType.school && findBoard.schoolId !== user.userSchoolId)
        throw new HttpException(404, '해당 게시글을 볼 수 없습니다.');

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
              user: {
                select: {
                  name: true,
                  id: true,
                  profile: true,
                },
              },
            },
          },
          user: {
            select: {
              name: true,
              id: true,
              profile: true,
            },
          },
        },
      });

      const findCommentsExcludeUser = await Promise.all(
        findComments.map(async comment => {
          const likeCount = await this.commentLike.count({
            where: {
              commentId: comment.id,
              likeType: LikeType.like,
            },
          });
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
                        ? null
                        : { name: reComment.user.name, id: reComment.user.id, profile: reComment.user.profile },
                      likeCounts: likeCount,
                    };
                  }),
                );

          return {
            ...comment,
            content: comment.isDeleted ? '삭제된 댓글입니다.' : comment.content,
            userId: comment.isAnonymous ? null : comment.user.id,
            isMe: comment.userId === user.id,
            likeCounts: likeCount,
            user: comment.isDeleted
              ? {
                  name: '(삭제됨)',
                  id: null,
                }
              : comment.isAnonymous
              ? null
              : { name: comment.user.name, id: comment.user.id, profile: comment.user.profile },
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
        contents: findCommentsExcludeUser.sort((a, b) => {
          if (a.createdAt > b.createdAt) return 1;
          else if (a.createdAt < b.createdAt) return -1;
          else return 0;
        }),
        totalPage: findCommentsCount === 0 ? 1 : Math.ceil(findCommentsCount / 10),
        numberPage: page ? Number(page) : 1,
      };
    } catch (e) {
      if (e instanceof HttpException) {
        throw e;
      }
    }
  }

  public async getComment(
    commentId: string,
    user: UserWithSchool,
  ): Promise<
    Comment & {
      isMe: boolean;
      likeCounts: number;
      user: any;
      recomments: any;
    }
  > {
    try {
      const findComment = await this.comment.findUnique({
        where: {
          id: Number(commentId),
        },
        include: {
          recomments: {
            include: {
              user: {
                select: {
                  name: true,
                  id: true,
                  profile: true,
                },
              },
            },
          },
          article: {
            include: {
              board: true,
            },
          },
          user: {
            select: {
              name: true,
              id: true,
              profile: true,
            },
          },
        },
      });

      if (!findComment) {
        throw new HttpException(404, '해당하는 댓글이 없습니다.');
      }
      if (
        findComment.article.board.boardType === BoardType.share &&
        findComment.article.board.schoolId != 'all' &&
        findComment.article.board.schoolId !== user.userSchool.school.atptCode
      )
        throw new HttpException(404, '해당 게시글을 볼 수 없습니다.');
      if (findComment.article.board.boardType === BoardType.school && findComment.article.board.schoolId !== user.userSchoolId)
        throw new HttpException(404, '해당 게시글을 볼 수 없습니다.');

      const likeCount = await this.commentLike.count({
        where: {
          commentId: findComment.id,
          likeType: LikeType.like,
        },
      });

      const reCommentsExcludeUser =
        findComment.recomments.length === 0
          ? []
          : await Promise.all(
              findComment.recomments.map(async reComment => {
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
                    ? null
                    : { name: reComment.user.name, id: reComment.user.id, profile: reComment.user.profile },
                  likeCounts: likeCount,
                };
              }),
            );

      return {
        ...findComment,
        content: findComment.isDeleted ? '삭제된 댓글입니다.' : findComment.content,
        userId: findComment.isAnonymous ? null : findComment.user.id,
        isMe: findComment.userId === user.id,
        likeCounts: likeCount,
        user: findComment.isDeleted
          ? {
              name: '(삭제됨)',
              id: null,
            }
          : findComment.isAnonymous
          ? null
          : { name: findComment.user.name, id: findComment.user.id, profile: findComment.user.profile },
        recomments: reCommentsExcludeUser.sort((a, b) => {
          if (a.createdAt > b.createdAt) return 1;
          else if (a.createdAt < b.createdAt) return -1;
          else return 0;
        }),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  }

  public async getReComment(
    user: UserWithSchool,
    commentId: string,
    recommentId: string,
  ): Promise<
    ReComment & {
      isMe: boolean;
      likeCounts: number;
      user: any;
    }
  > {
    try {
      const findReComment = await this.reComment.findUnique({
        where: {
          id: Number(recommentId),
        },
        include: {
          article: {
            include: {
              board: true,
            },
          },
          user: {
            select: {
              name: true,
              id: true,
              profile: true,
            },
          },
        },
      });

      if (!findReComment) {
        throw new HttpException(404, '해당하는 댓글이 없습니다.');
      }

      if (
        findReComment.article.board.boardType === BoardType.share &&
        findReComment.article.board.schoolId != 'all' &&
        findReComment.article.board.schoolId != user.userSchool.school.atptCode
      )
        throw new HttpException(404, '해당 댓글을 볼 수 없습니다.');
      if (findReComment.article.board.boardType === BoardType.school && findReComment.article.board.schoolId !== user.userSchoolId)
        throw new HttpException(404, '해당 댓글을 볼 수 없습니다.');

      const likeCount = await this.reCommentLike.count({
        where: {
          recommentId: findReComment.id,
          likeType: LikeType.like,
        },
      });

      return {
        ...findReComment,
        content: findReComment.isDeleted ? '삭제된 댓글입니다.' : findReComment.content,
        userId: findReComment.isAnonymous ? null : findReComment.user.id,
        isMe: findReComment.userId === user.id,
        likeCounts: likeCount,
        user: findReComment.isDeleted
          ? {
              name: '(삭제됨)',
              id: null,
            }
          : findReComment.isAnonymous
          ? null
          : { name: findReComment.user.name, id: findReComment.user.id, profile: findReComment.user.profile },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  }

  public async postComment(commentData: Comment, articleId: string, user: UserWithSchool): Promise<Comment> {
    try {
      const findArticle = await this.article.findUnique({
        where: {
          id: Number(articleId),
        },
        include: {
          board: true,
        },
      });

      if (!findArticle) {
        throw new HttpException(404, '해당하는 게시글이 없습니다.');
      }

      if (
        findArticle.board.boardType === BoardType.share &&
        findArticle.board.schoolId != 'all' &&
        findArticle.board.schoolId !== user.userSchool.school.atptCode
      )
        throw new HttpException(404, '해당 게시글에 댓글을 작성할 수 없습니다.');
      if (findArticle.board.boardType === BoardType.school && findArticle.board.schoolId !== user.userSchoolId)
        throw new HttpException(404, '해당 게시글에 댓글을 작성할 수 없습니다.');

      const createComment = await this.comment.create({
        data: {
          ...commentData,
          articleId: Number(articleId),
          userId: user.id,
        },
      });

      await this.adminService.sendPushNotification(
        findArticle.userId,
        '새로운 댓글이 추가되었어요',
        `${findArticle.title.length > 10 ? `${findArticle.title.slice(0, 10)}...` : findArticle.title} 게시글에 새로운 댓글이 추가되었어요!`,
        {
          type: 'openstacks',
          url: [`/board/`, `/board/${findArticle.boardId}/${findArticle.id}`],
        },
      );

      return createComment;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  }

  public async postReComment(reCommentData: Comment, commentId: string, user: UserWithSchool): Promise<Comment> {
    try {
      const findComment = await this.comment.findUnique({
        where: {
          id: Number(commentId),
        },
        include: {
          article: {
            include: {
              board: true,
            },
          },
        },
      });

      if (!findComment) {
        throw new HttpException(404, '해당하는 댓글이 없습니다.');
      }

      if (
        findComment.article.board.boardType === BoardType.share &&
        findComment.article.board.schoolId != 'all' &&
        findComment.article.board.schoolId !== user.userSchool.school.atptCode
      )
        throw new HttpException(404, '해당 댓글에 댓글을 작성할 수 없습니다.');
      if (findComment.article.board.boardType === BoardType.school && findComment.article.board.schoolId !== user.userSchoolId)
        throw new HttpException(404, '해당 댓글에 댓글을 작성할 수 없습니다.');

      const createReComment = await this.reComment.create({
        data: {
          ...reCommentData,
          commentId: Number(commentId),
          articleId: findComment.articleId,
          userId: user.id,
        },
      });

      await this.adminService.sendPushNotification(
        findComment.article.userId,
        '새로운 댓글이 추가되었어요',
        `${
          findComment.article.title.length > 10 ? `${findComment.article.title.slice(0, 10)}...` : findComment.article.title
        } 게시글에 새로운 댓글이 추가되었어요!`,
        {
          type: 'openstacks',
          url: [`/board`, `/board/${findComment.article.boardId}/${findComment.article.id}`],
        },
      );

      return createReComment;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  }

  public async likeArticle(articleId: string, user: UserWithSchool, likeType: LikeType): Promise<any> {
    try {
      const findArticle = await this.article.findUnique({
        where: {
          id: Number(articleId),
        },
        include: {
          board: true,
        },
      });

      if (!findArticle) {
        throw new HttpException(404, '해당하는 게시글이 없습니다.');
      }

      if (
        findArticle.board.boardType === BoardType.share &&
        findArticle.board.schoolId != 'all' &&
        findArticle.board.schoolId !== user.userSchool.school.atptCode
      )
        throw new HttpException(404, '해당 게시글을 볼 수 없습니다.');

      if (findArticle.board.boardType === BoardType.school && findArticle.board.schoolId !== user.userSchoolId)
        throw new HttpException(404, '해당 게시글을 볼 수 없습니다.');

      const ArticleLike = await this.articleLike.findFirst({
        where: {
          userId: user.id,
          articleId: findArticle.id,
        },
      });

      if (!ArticleLike) {
        const createArticleLike = await this.articleLike.create({
          data: {
            userId: user.id,
            articleId: findArticle.id,
            likeType: likeType,
          },
        });
        await this.handleHotArticle(findArticle);

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
        await this.handleHotArticle(findArticle);

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

      const isCommentLike = await this.commentLike.findFirst({
        where: {
          userId: userId,
          commentId: findComment.id,
          likeType: likeType,
        },
      });

      if (isCommentLike) {
        await this.commentLike.delete({
          where: {
            id: isCommentLike.id,
          },
        });

        return null;
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

  public likeReComment = async (reCommentId: string, user: UserWithSchool, likeType: LikeType): Promise<any> => {
    try {
      const findReComment = await this.reComment.findUnique({
        where: {
          id: Number(reCommentId),
        },
        include: {
          article: {
            include: {
              board: true,
            },
          },
        },
      });

      if (!findReComment) {
        throw new HttpException(404, '해당하는 대댓글이 없습니다.');
      }

      if (
        findReComment.article.board.boardType === BoardType.share &&
        findReComment.article.board.schoolId != 'all' &&
        findReComment.article.board.schoolId !== user.userSchool.school.atptCode
      )
        throw new HttpException(404, '해당 댓글을 볼 수 없습니다.');

      if (findReComment.article.board.boardType === BoardType.school && findReComment.article.board.schoolId !== user.userSchoolId)
        throw new HttpException(404, '해당 댓글을 볼 수 없습니다.');

      const hasReCommentLike = await this.reCommentLike.findFirst({
        where: {
          userId: user.id,
          recommentId: findReComment.id,
          likeType: likeType,
        },
      });

      if (hasReCommentLike) {
        await this.reCommentLike.delete({
          where: {
            id: hasReCommentLike.id,
          },
        });

        return null;
      }

      const createReCommentLike = await this.reCommentLike.create({
        data: {
          userId: user.id,
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

      await this.deletedArticle.create({
        data: {
          ...findArticle,
        },
      });

      const images = findArticle.images;

      if (images.length !== 0) {
        for await (const imageId of images) {
          await deleteImage(imageId);
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

  public async deleteComment(commentId: string, user: UserWithSchool): Promise<any> {
    try {
      const findComment = await this.comment.findUnique({
        where: {
          id: Number(commentId),
        },
      });

      if (!findComment) {
        throw new HttpException(404, '해당하는 댓글이 없습니다.');
      }

      if (findComment.userId !== user.id) {
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

  public async getUserArticles(userId: string, page: string, user: User): Promise<ArticleWithDetail[]> {
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

      return findArticles.map(async article => {
        return {
          ...article,
          commentCounts: article.comment.length + article.reComment.length,
          likeCounts: article.articleLike.filter(like => like.likeType === LikeType.like).length,
          disLikeCounts: article.articleLike.filter(like => like.likeType === LikeType.dislike).length,
          isMe: article.userId === user.id,
        } as unknown as ArticleWithDetail;
      }) as unknown as ArticleWithDetail[];
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, error.message);
      }
    }
  }

  public async getUserLikes(userId: string, page: string, user: User): Promise<ArticleWithDetail[]> {
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
            },
          },
        },
      });

      return findLikes.map(like => {
        return {
          ...like.article,
          commentCounts: like.article.comment.length + like.article.reComment.length,
          likeCounts: like.article.articleLike.filter(like => like.likeType === LikeType.like).length,
          disLikeCounts: like.article.articleLike.filter(like => like.likeType === LikeType.dislike).length,
          isMe: like.article.userId === user.id,
        };
      }) as unknown as ArticleWithDetail[];
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, error);
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
        },
      });

      const findReComments = await this.reComment.findMany({
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
        },
      });

      const combinedComments = [...findComments, ...findReComments];
      combinedComments.sort((a, b) => {
        if (a.createdAt > b.createdAt) return -1;
        else if (a.createdAt < b.createdAt) return 1;
        else return 0;
      });

      return combinedComments.slice(0, 10);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, error);
      }
    }
  }

  public async getHotArticles(
    user: UserWithSchool,
    page: string,
  ): Promise<{
    contents: ArticleWithDetail[];
    totalPage: number;
    numberPage: number;
  }> {
    try {
      const findHotArticles = await this.hotArticle.findMany({
        where: {
          OR: [
            {
              schoolId: user.userSchoolId,
            },
            {
              schoolId: user.userSchool.school.atptCode,
            },
            {
              schoolId: 'all',
            },
          ],
        },
        skip: page ? (Number(page) - 1) * 10 : 0,
        take: 10,
        include: {
          article: {
            include: {
              user: true,
              articleLike: true,
              comment: true,
              reComment: true,
            },
          },
        },
      });

      const hotArticleTotal = await this.hotArticle.count();
      const hotArticleTotalPage = hotArticleTotal === 0 ? 1 : Math.ceil(hotArticleTotal / 10);

      const filteredArticles = await Promise.all(
        findHotArticles.map(async hotArticle => {
          const filteredArticle = await this.getArticle(hotArticle.articleId.toString(), user);
          return filteredArticle;
        }),
      );

      const blindedArticles = await Promise.all(
        filteredArticles.map(async filteredArticle => {
          if (!filteredArticle.isAnonymous) {
            const isBlindedUser = await this.reportBlindUser.findFirst({
              where: {
                targetUserId: filteredArticle.userId,
                userId: user.id,
              },
            });
            if (isBlindedUser) return null;
          }
          const blindedArticle = await this.blindArticle.findFirst({
            where: {
              articleId: filteredArticle.id,
              userId: user.id,
            },
          });

          if (blindedArticle) return null;

          return filteredArticle;
        }),
      );

      return {
        contents: blindedArticles.filter(blindedArticle => blindedArticle),
        totalPage: hotArticleTotalPage,
        numberPage: page ? Number(page) : 1,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, error);
      }
    }
  }

  public async getAllArticles(
    page: string,
    user: UserWithSchool,
  ): Promise<{
    contents: ArticleWithDetail[];
    totalPage: number;
    numberPage: number;
  }> {
    try {
      const findArticles = await this.article.findMany({
        where: {
          OR: [
            {
              schoolId: user.userSchoolId,
            },
            {
              schoolId: user.userSchool.school.atptCode,
            },
            {
              schoolId: 'all',
            },
          ],
        },
        skip: page ? (Number(page) - 1) * 10 : 0,
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          articleLike: true,
          user: true,
          _count: {
            select: {
              comment: true,
              reComment: true,
            },
          },
        },
      });

      const allArticleTotal = await this.article.count();
      const allArticleTotalPage = allArticleTotal === 0 ? 1 : Math.ceil(allArticleTotal / 10);

      return {
        contents: findArticles.map(article => {
          return {
            ...article,
            isMe: article.userId === user.id,
            commentCounts: article._count.comment + article._count.reComment,
            likeCounts: article.articleLike.filter(like => like.likeType === LikeType.like).length,
            disLikeCounts: article.articleLike.filter(like => like.likeType === LikeType.dislike).length,
            user: {
              id: article.isAnonymous ? null : article.user.id,
              name: article.isAnonymous ? null : article.user.name,
              profile: article.isAnonymous ? null : article.user.profile,
            },
          };
        }),
        totalPage: allArticleTotalPage,
        numberPage: page ? Number(page) : 1,
      };
    } catch (error) {
      throw new HttpException(500, error);
    }
  }

  public async increaseViews(articleId: string): Promise<void> {
    try {
      const findArticle = await this.article.findUnique({
        where: {
          id: Number(articleId),
        },
      });

      if (!findArticle) {
        throw new HttpException(404, '해당하는 게시글이 없습니다.');
      }

      await this.article.update({
        where: {
          id: Number(articleId),
        },
        data: {
          views: findArticle.views + 1,
        },
      });
    } catch (error) {
      throw new HttpException(500, error);
    }
  }

  private async handleHotArticle(article: Article): Promise<void> {
    try {
      const likeCount = await this.articleLike.count({
        where: {
          articleId: article.id,
          likeType: LikeType.like,
        },
      });

      if (likeCount >= 5) {
        await this.hotArticle.create({
          data: {
            articleId: article.id,
            schoolId: article.schoolId,
          },
        });
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, error.message);
      }
    }
  }
}
