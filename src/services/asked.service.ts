import { AskedDto, AskedReceiveDto } from '@/dtos/asked.dto';
import { HttpException } from '@/exceptions/HttpException';
import { UserWithSchool } from '@/interfaces/auth.interface';
import { AskedUser, PrismaClient, Process, User } from '@prisma/client';
import { AxiosError } from 'axios';

class AskedService {
  public asked = new PrismaClient().asked;
  public askedUser = new PrismaClient().askedUser;
  public user = new PrismaClient().user;

  public getAsked = async (user: UserWithSchool, page: string): Promise<any> => {
    if (!user.userSchoolId) throw new HttpException(404, '학교 정보가 없습니다.');
    try {
      const schoolUsers = await this.user.findMany({
        where: {
          userSchoolId: user.userSchoolId,
        },
        skip: page ? (Number(page) - 1) * 10 : 0,
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
      });

      const askedUserList = await Promise.all(
        schoolUsers.map(async schoolUser => {
          const askedUser = await this.askedUser.findUnique({
            where: {
              userId: schoolUser.id,
            },
            include: {
              user: {
                select: {
                  name: true,
                  profile: true,
                },
              },
            },
          });

          if (!askedUser) {
            const createdAskedUser = await this.askedUser.create({
              data: {
                userId: schoolUser.id,
              },
              include: {
                user: {
                  select: {
                    name: true,
                    profile: true,
                  },
                },
              },
            });

            return createdAskedUser;
          } else {
            return askedUser;
          }
        }),
      );

      return askedUserList;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  public updateAskedCustomId = async (user: User, customId: string): Promise<AskedUser> => {
    try {
      const findAskedInfo = await this.askedUser.findUnique({
        where: {
          userId: user.id,
        },
      });

      if (!findAskedInfo) throw new HttpException(404, '찾을 수 없는 질문입니다.');

      if (findAskedInfo.userId !== user.id) throw new HttpException(403, '권한이 없습니다.');

      if (findAskedInfo.lastUpdateCustomId && findAskedInfo.lastUpdateCustomId.getTime() + 1000 * 60 * 60 * 24 * 30 > new Date().getTime())
        throw new HttpException(403, '한달에 한번만 변경할 수 있습니다.');

      const hadAskedCustomId = await this.askedUser.findFirst({
        where: {
          customId: customId,
        },
      });
      if (hadAskedCustomId) throw new HttpException(403, '이미 사용중인 아이디입니다.');

      const updatedAsked = await this.askedUser.update({
        where: {
          userId: user.id,
        },
        data: {
          customId,
          lastUpdateCustomId: new Date(),
        },
      });

      return updatedAsked;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  public meAsked = async (user: UserWithSchool, page: string): Promise<any> => {
    try {
      const askedList = await this.asked.findMany({
        where: {
          askedUserId: user.id,
        },
        skip: page ? (Number(page) - 1) * 10 : 0,
        take: 7,
        include: {
          questionUser: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      let askedUser = await this.askedUser.findUnique({
        where: {
          userId: user.id,
        },
        include: {
          user: true,
        },
      });

      if (!askedUser) {
        askedUser = await this.askedUser.create({
          data: {
            userId: user.id,
          },
          include: {
            user: true,
          },
        });
      }

      const returnAskedList = askedList.map(asked => ({
        ...asked,
        userId: asked.isAnonymous ? null : asked.userId,
        questionUser: {
          name: asked.isAnonymous ? '익명' : asked.questionUser.name,
          profile: asked.isAnonymous ? null : asked.questionUser.profile,
        },
      }));

      const askedCount = await this.asked.count({
        where: {
          userId: user.id,
        },
      });

      const deniedCount = await this.asked.count({
        where: {
          userId: user.id,
          process: Process.denied,
        },
      });

      const successCount = await this.asked.count({
        where: {
          userId: user.id,
          process: Process.success,
        },
      });

      const pendingCount = await this.asked.count({
        where: {
          userId: user.id,
          process: Process.pending,
        },
      });

      return {
        askeds: returnAskedList,
        user: {
          user: {
            name: askedUser.user.name,
            profile: askedUser.user.profile,
          },
          userId: askedUser.userId,
          customId: askedUser.customId,
          statusMessage: askedUser.statusMessage,
        },
        pages: Math.ceil(askedCount / 7),
        deniedCount,
        successCount,
        pendingCount,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  public getAskedUser = async (userId: string, page: string, user: User): Promise<any> => {
    try {
      const findAskedUser = await this.askedUser.findFirst({
        where: {
          OR: [
            {
              userId: userId,
            },
            {
              customId: userId,
            },
          ],
        },
        include: {
          user: true,
          asked: {
            include: {
              questionUser: true,
            },
            skip: page ? (Number(page) - 1) * 10 : 0,
            take: 10,
            orderBy: {
              createdAt: 'desc',
            },
            where: {
              OR: [
                {
                  process: Process.success,
                },
                {
                  process: Process.pending,
                },
              ],
            },
          },
        },
      });

      if (!findAskedUser.receiveOtherSchool) {
        if (findAskedUser.user.userSchoolId !== user.userSchoolId) throw new HttpException(403, '권한이 없습니다.');
      }

      if (!findAskedUser) {
        const findUser = await this.user.findUnique({
          where: {
            id: userId,
          },
        });
        if (!findUser) throw new HttpException(404, '찾을 수 없는 유저입니다.');

        const createdAskedUser = await this.askedUser.create({
          data: {
            userId: findUser.id,
          },
        });

        return createdAskedUser;
      }

      const filteredAsked = findAskedUser.asked
        .map(asked => ({
          ...asked,
          questionUser: {
            name: asked.isAnonymous ? '익명' : asked.questionUser.name,
            profile: asked.isAnonymous ? null : asked.questionUser.profile,
          },
          askedUserId: asked.isAnonymous ? null : asked.askedUserId,
        }))
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      const askedCount = await this.asked.count({
        where: {
          askedUserId: findAskedUser.userId,
        },
      });

      return {
        askeds: filteredAsked,
        user: {
          user: {
            profile: findAskedUser.user.profile,
            name: findAskedUser.user.name,
          },
          statusMessage: findAskedUser.statusMessage,
          userId: findAskedUser.user.id,
          customId: findAskedUser.customId,
        },
        pages: Math.ceil(askedCount / 10),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else if (error instanceof AxiosError) {
        throw new HttpException(500, '오류가 발생했습니다.');
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  public getAskedById = async (askedId: string): Promise<any> => {
    try {
      const findAskedInfo = await this.asked.findUnique({
        where: {
          id: askedId,
        },
      });

      if (!findAskedInfo) throw new HttpException(404, '찾을 수 없는 질문입니다.');

      return findAskedInfo;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else if (error instanceof AxiosError) {
        throw new HttpException(500, '오류가 발생했습니다.');
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  public changeStatusmessage = async (user: User, message: string): Promise<any> => {
    try {
      const findAskedInfo = await this.askedUser.findUnique({
        where: {
          userId: user.id,
        },
      });

      if (!findAskedInfo) throw new HttpException(404, '찾을 수 없는 질문입니다.');

      if (findAskedInfo.userId !== user.id) throw new HttpException(403, '권한이 없습니다.');

      const updatedAsked = await this.askedUser.update({
        where: {
          userId: user.id,
        },
        data: {
          statusMessage: message,
        },
      });

      return updatedAsked;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  public denyAsked = async (user: User, askedId: string): Promise<any> => {
    try {
      const findAskedInfo = await this.asked.findFirst({
        where: {
          id: askedId,
        },
      });

      if (!findAskedInfo) throw new HttpException(404, '찾을 수 없는 질문입니다.');
      if (findAskedInfo.askedUserId !== user.id) throw new HttpException(403, '거절할 권한이 없습니다.');

      const updatedAsked = await this.asked.update({
        where: {
          id: askedId,
        },
        data: {
          process: Process.denied,
        },
      });

      return updatedAsked;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  public createAsked = async (user: User, targetUserId: string, askedQuestion: AskedDto): Promise<any> => {
    try {
      const findAskedInfo = await this.askedUser.findUnique({
        where: {
          userId: targetUserId,
        },
        include: {
          user: true,
        },
      });

      if (!findAskedInfo) throw new HttpException(404, '찾을 수 없는 유저입니다.');

      if (findAskedInfo.receiveOtherSchool) {
        if (findAskedInfo.user.userSchoolId !== user.userSchoolId) throw new HttpException(403, '다른학교 학생의 질문을 받지 않습니다.');
      }

      if (!findAskedInfo.receiveAnonymous) {
        if (askedQuestion.isAnonymous) throw new HttpException(403, '익명으로 질문을 받지 않습니다.');
      }

      const createdAsked = await this.asked.create({
        data: {
          question: askedQuestion.question,
          askedUserId: targetUserId,
          userId: user.id,
          isAnonymous: askedQuestion.isAnonymous,
        },
      });

      return createdAsked;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else if (error instanceof AxiosError) {
        throw new HttpException(500, '오류가 발생했습니다.');
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  public receiveAsked = async (user: User, askedId: string, answer: AskedReceiveDto): Promise<any> => {
    const findAsked = await this.asked.findUnique({
      where: {
        id: askedId,
      },
    });

    if (!findAsked) throw new HttpException(404, '찾을 수 없는 질문입니다.');

    if (findAsked.askedUserId !== user.id) throw new HttpException(403, '답장할 권한이 없습니다.');
    if (findAsked.process === 'success') throw new HttpException(403, '이미 답장한 질문입니다.');
    if (findAsked.process === 'denied') throw new HttpException(403, '이미 거절한 질문입니다.');

    const updatedAsked = await this.asked.update({
      where: {
        id: askedId,
      },
      data: {
        answer: answer.answer,
        process: Process.success,
        answerTimeAt: new Date(),
      },
    });

    return updatedAsked;
  };

  public deleteAsked = async (user: User, askedId: string): Promise<any> => {
    try {
      const findAskedInfo = await this.asked.findFirst({
        where: {
          id: askedId,
        },
      });

      if (!findAskedInfo) throw new HttpException(404, '찾을 수 없는 질문입니다.');
      if (findAskedInfo.askedUserId !== user.id) throw new HttpException(403, '삭제할 권한이 없습니다.');

      const deletedAsked = await this.asked.delete({
        where: {
          id: askedId,
        },
      });

      return deletedAsked;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  };
}

export default AskedService;
