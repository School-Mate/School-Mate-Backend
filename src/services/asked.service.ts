import { AskedDto, AskedReceiveDto } from '@/dtos/asked.dto';
import { HttpException } from '@/exceptions/HttpException';
import { UserWithSchool } from '@/interfaces/auth.interface';
import { PrismaClient, Process, User } from '@prisma/client';
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
      });

      const askedList = await this.askedUser.findMany({
        where: {
          userId: {
            in: schoolUsers.map(user => user.id),
          },
        },
        include: {
          user: true,
        },
      });

      const askedUserList = askedList.map(asked => ({
        ...asked,
        user: {
          name: asked.user.name,
          profile: asked.user.profile,
        },
      }));

      return askedUserList;
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
          userId: user.id,
        },
        skip: page ? (Number(page) - 1) * 10 : 0,
        take: 10,
        include: {
          QuestionUser: true,
        },
      });

      const askedUser = await this.askedUser.findFirst({
        where: {
          userId: user.id,
        },
        include: {
          user: true,
        },
      });

      const returnAskedList = askedList.map(asked => ({
        ...asked,
        QuestionUser: {
          name: asked.isAnonymous ? '익명' : asked.QuestionUser.name,
          profile: asked.isAnonymous ? null : asked.QuestionUser.profile,
        },
      }));

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
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  public getAskedUser = async (userId: string, page: string): Promise<any> => {
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
          Asked: {
            skip: page ? (Number(page) - 1) * 10 : 0,
            take: 10,
          },
          user: true,
        },
      });

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

      return {
        ...findAskedUser,
        user: {
          name: findAskedUser.user.name,
          profile: findAskedUser.user.profile,
        },
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
      if (findAskedInfo.userId !== user.id) throw new HttpException(403, '거절할 권한이 없습니다.');

      const updatedAsked = await this.asked.update({
        where: {
          id: askedId,
        },
        data: {
          process: Process.deny,
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

    if (findAsked.userId !== user.id) throw new HttpException(403, '답장할 권한이 없습니다.');
    if (findAsked.process === 'success') throw new HttpException(403, '이미 답장한 질문입니다.');
    if (findAsked.process === 'deny') throw new HttpException(403, '이미 거절한 질문입니다.');

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
      if (findAskedInfo.userId !== user.id) throw new HttpException(403, '삭제할 권한이 없습니다.');

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
