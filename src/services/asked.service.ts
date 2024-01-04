import { AskedCreateDto, AskedDto, AskedReceiveDto, AskedUpdateDto } from '@/dtos/asked.dto';
import { HttpException } from '@/exceptions/HttpException';
import { UserWithSchool } from '@/interfaces/auth.interface';
import { logger } from '@/utils/logger';
import { deleteImage } from '@/utils/multer';
import { AskedUser, Image, Process, User } from '@prisma/client';
import { AxiosError } from 'axios';
import { AdminService } from './admin.service';
import Container, { Service } from 'typedi';
import { PrismaClientService } from './prisma.service';
import eventEmitter from '@/utils/eventEmitter';

@Service()
export class AskedService {
  public asked = Container.get(PrismaClientService).asked;
  public askedUser = Container.get(PrismaClientService).askedUser;
  public user = Container.get(PrismaClientService).user;
  public image = Container.get(PrismaClientService).image;
  public adminService = Container.get(AdminService);

  public getAsked = async (
    user: UserWithSchool,
    page: string,
  ): Promise<{
    contents: AskedUser[];
    totalPage: number;
    numberPage: number;
  }> => {
    if (!user.userSchoolId) throw new HttpException(404, '학교 정보가 없습니다.');
    try {
      const users = await this.user.findMany({
        where: {
          AND: [
            {
              userSchoolId: user.userSchoolId,
            },
            {
              askedUser: {
                receiveAnonymous: true,
              },
            },
          ],
        },
        include: {
          askedUser: true,
        },
        orderBy: {
          askedUser: {
            lastUpdateCustomId: 'desc',
          },
        },
      });

      const totalCnt = await this.user.count({
        where: {
          userSchoolId: user.userSchoolId,
          askedUser: {
            receiveAnonymous: true,
          },
        },
      });

      return {
        contents: users.map(user => {
          const askedUser = user.askedUser;
          return {
            ...askedUser,
            user: {
              name: user.name,
              profile: user.profile,
            },
          };
        }),
        totalPage: totalCnt === 0 ? 1 : Math.ceil(totalCnt / 10),
        numberPage: page ? Number(page) : 1,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  public meAskedQuestions = async (user: UserWithSchool, page: string): Promise<any> => {
    const askedQuestions = await this.asked.findMany({
      where: {
        userId: user.id,
      },
      skip: page ? (Number(page) - 1) * 10 : 0,
      take: 10,
      include: {
        askedUser: {
          include: {
            user: {
              select: {
                name: true,
                profile: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const askedCount = await this.asked.count({
      where: {
        userId: user.id,
      },
    });

    return {
      contents: askedQuestions,
      totalPage: askedCount === 0 ? 1 : Math.ceil(askedCount / 10),
      numberPage: page ? Number(page) : 1,
    };
  };

  public getAskedSearch = async (user: UserWithSchool, page: string, keyword: string): Promise<any> => {
    if (!user.userSchoolId) throw new HttpException(404, '학교 정보가 없습니다.');
    try {
      const schoolUsers = await this.askedUser.findMany({
        where: {
          OR: [
            {
              AND: [
                {
                  OR: [
                    {
                      customId: {
                        contains: keyword,
                      },
                    },
                    {
                      tags: {
                        has: keyword,
                      },
                    },
                    {
                      user: {
                        name: {
                          contains: keyword,
                        },
                      },
                    },
                  ],
                },
                {
                  user: {
                    userSchoolId: user.userSchoolId,
                  },
                  receiveAnonymous: true,
                },
              ],
            },
            {
              AND: [
                {
                  OR: [
                    {
                      customId: {
                        contains: keyword,
                      },
                    },
                    {
                      tags: {
                        has: keyword,
                      },
                    },
                    {
                      user: {
                        name: {
                          contains: keyword,
                        },
                      },
                    },
                  ],
                },
                {
                  receiveAnonymous: true,
                  receiveOtherSchool: true,
                  user: {
                    userSchool: {
                      school: {
                        atptCode: user.userSchool.school.atptCode,
                      },
                    },
                  },
                },
              ],
            },
          ],
        },
        include: {
          user: {
            select: {
              name: true,
              profile: true,
              userSchool: {
                select: {
                  school: {
                    select: {
                      name: true,
                      schoolId: true,
                      defaultName: true,
                    },
                  },
                },
              },
            },
          },
        },
        skip: page ? (Number(page) - 1) * 10 : 0,
        take: 10,
        orderBy: {
          lastUpdateCustomId: 'desc',
        },
      });

      const totalCnt = await this.askedUser.count({
        where: {
          OR: [
            {
              AND: [
                {
                  OR: [
                    {
                      customId: {
                        contains: keyword,
                      },
                    },
                    {
                      tags: {
                        has: keyword,
                      },
                    },
                    {
                      user: {
                        name: {
                          contains: keyword,
                        },
                      },
                    },
                  ],
                },
                {
                  user: {
                    userSchoolId: user.userSchoolId,
                  },
                  receiveAnonymous: true,
                },
              ],
            },
            {
              AND: [
                {
                  OR: [
                    {
                      customId: {
                        contains: keyword,
                      },
                    },
                    {
                      tags: {
                        has: keyword,
                      },
                    },
                    {
                      user: {
                        name: {
                          contains: keyword,
                        },
                      },
                    },
                  ],
                },
                {
                  receiveAnonymous: true,
                  receiveOtherSchool: true,
                  user: {
                    userSchool: {
                      school: {
                        atptCode: user.userSchool.school.atptCode,
                      },
                    },
                  },
                },
              ],
            },
          ],
        },
      });

      return {
        contents: schoolUsers,
        totalPage: totalCnt === 0 ? 1 : Math.ceil(totalCnt / 10),
        numberPage: page ? Number(page) : 1,
      };
    } catch (error) {
      logger.error(error);
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  public deleteImage = async (user: User): Promise<void> => {
    try {
      const findAskedInfo = await this.askedUser.findUnique({
        where: {
          userId: user.id,
        },
      });

      if (findAskedInfo.userId !== user.id) throw new HttpException(403, '권한이 없습니다.');

      if (findAskedInfo.image) {
        await deleteImage(findAskedInfo.image);
      }

      await this.askedUser.update({
        where: {
          userId: user.id,
        },
        data: {
          image: null,
        },
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  public updateImage = async (user: User, file: Express.MulterS3.File): Promise<string> => {
    try {
      const findAskedInfo = await this.askedUser.findUnique({
        where: {
          userId: user.id,
        },
      });

      if (findAskedInfo.userId !== user.id) throw new HttpException(403, '권한이 없습니다.');

      if (findAskedInfo.image) {
        await deleteImage(findAskedInfo.image);
      }

      if (!file) {
        await this.askedUser.update({
          where: {
            userId: user.id,
          },
          data: {
            image: null,
          },
        });

        return null;
      }

      await this.askedUser.update({
        where: {
          userId: user.id,
        },
        data: {
          image: file.key,
        },
      });

      eventEmitter.emit('imageResize', file.key, 'askedprofile');

      return file.key;
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
        take: 10,
        include: {
          questionUser: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const askedUser = await this.askedUser.findUnique({
        where: {
          userId: user.id,
        },
        include: {
          user: true,
        },
      });

      if (!askedUser) throw new HttpException(404, '에스크 사용자를 등록해주세요');

      const returnAskedList = askedList.map(asked => ({
        ...asked,
        userId: asked.isAnonymous ? null : asked.userId,
        questionUser: {
          name: asked.isAnonymous ? '익명' : asked.questionUser.name,
          profile: asked.isAnonymous ? null : asked.questionUser.profile,
        },
        isOtherSchool: askedUser.user.userSchoolId !== asked.questionUser.userSchoolId ? true : false,
      }));

      const askedCount = await this.asked.count({
        where: {
          askedUserId: user.id,
        },
      });

      return {
        user: {
          user: {
            profile: askedUser.image ? askedUser.image : null,
            name: askedUser.user.name,
          },
          tags: askedUser.tags,
          userId: askedUser.userId,
          customId: askedUser.customId,
          statusMessage: askedUser.statusMessage,
          receiveOtherSchool: askedUser.receiveOtherSchool,
        },
        contents: returnAskedList,
        totalPage: askedCount === 0 ? 1 : Math.ceil(askedCount / 10),
        numberPage: page ? Number(page) : 1,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  public createAskedUser = async (user: User, askedUser: AskedCreateDto): Promise<any> => {
    try {
      let image: Image | null = null;
      if (askedUser.image) {
        image = await this.image.findUnique({
          where: {
            id: askedUser.image,
          },
        });

        if (!image) throw new HttpException(404, '이미지를 찾을 수 없습니다.');
      }

      const findAskedUser = await this.askedUser.findFirst({
        where: {
          customId: {
            contains: askedUser.id,
            mode: 'insensitive',
          },
        },
      });

      if (findAskedUser) throw new HttpException(409, '이미 사용중인 아이디입니다.');

      const forbiddenId = ['admin', 'administrator', 'root', 'esc', 'asked', 'ask', 'question', 'questions', '', 'intro', 'modify'];
      if (forbiddenId.includes(askedUser.id)) throw new HttpException(403, '사용할 수 없는 아이디입니다.');

      const createdAskedUser = await this.askedUser.create({
        data: {
          userId: user.id,
          receiveAnonymous: true,
          receiveOtherSchool: askedUser.receiveOtherSchool,
          tags: [askedUser.tag1, askedUser.tag2],
          customId: askedUser.id,
          ...(image && { image: image.key }),
        },
      });

      return createdAskedUser;
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
          user: {
            select: {
              id: true,
              name: true,
              profile: true,
              userSchoolId: true,
            },
          },
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

      if (!findAskedUser) throw new HttpException(404, '찾을 수 없는 유저입니다.');

      if (!findAskedUser.receiveOtherSchool) {
        if (findAskedUser.user.userSchoolId !== user.userSchoolId) throw new HttpException(403, '권한이 없습니다.');
      }

      const filteredAsked = findAskedUser.asked
        .map(asked => ({
          ...asked,
          questionUser: {
            name: asked.isAnonymous ? '익명' : asked.questionUser.name,
            profile: asked.isAnonymous ? null : asked.questionUser.profile,
          },
          isMyAsked: asked.userId === user.id,
        }))
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      const askedCount = await this.asked.count({
        where: {
          askedUserId: findAskedUser.userId,
        },
      });

      return {
        contents: filteredAsked,
        user: {
          user: {
            profile: findAskedUser.image ? findAskedUser.image : null,
            name: findAskedUser.user.name,
          },
          tags: findAskedUser.tags,
          statusMessage: findAskedUser.statusMessage,
          userId: findAskedUser.user.id,
          customId: findAskedUser.customId,
          receiveOtherSchool: findAskedUser.receiveOtherSchool,
        },
        totalPage: askedCount === 0 ? 1 : Math.ceil(askedCount / 10),
        numberPage: page ? Number(page) : 1,
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
        include: {
          questionUser: {
            select: {
              name: true,
              profile: true,
              userSchoolId: true,
            },
          },
          askedUser: {
            select: {
              customId: true,
              user: {
                select: {
                  name: true,
                  profile: true,
                  userSchoolId: true,
                },
              },
            },
          },
        },
      });
      if (!findAskedInfo) throw new HttpException(404, '찾을 수 없는 질문입니다.');

      return {
        ...findAskedInfo,
        questionUser: {
          name: findAskedInfo.isAnonymous ? '익명' : findAskedInfo.questionUser.name,
          profile: findAskedInfo.isAnonymous ? null : findAskedInfo.questionUser.profile,
        },
        askedUserId: findAskedInfo.askedUserId,
        isOtherSchool: findAskedInfo.askedUser.user.userSchoolId !== findAskedInfo.questionUser.userSchoolId ? true : false,
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

  public addTag = async (user: User, tag: string): Promise<string[]> => {
    try {
      const findAskedInfo = await this.askedUser.findUnique({
        where: {
          userId: user.id,
        },
      });

      if (findAskedInfo.userId !== user.id) throw new HttpException(403, '권한이 없습니다.');

      const updatedTags = findAskedInfo.tags;
      if (updatedTags.length >= 2) {
        updatedTags.shift();
      }
      updatedTags.push(tag);

      await this.askedUser.update({
        where: {
          userId: user.id,
        },
        data: {
          tags: updatedTags,
        },
      });

      return updatedTags;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  public removeTags = async (user: User): Promise<string[]> => {
    try {
      const findAskedInfo = await this.askedUser.findUnique({
        where: {
          userId: user.id,
        },
      });

      if (findAskedInfo.userId !== user.id) throw new HttpException(403, '권한이 없습니다.');

      await this.askedUser.update({
        where: {
          userId: user.id,
        },
        data: {
          tags: [],
        },
      });

      return [];
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

      await this.asked.update({
        where: {
          id: askedId,
        },
        data: {
          process: Process.denied,
        },
      });

      const updatedAsked = await this.getAskedById(askedId);
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

      if (!findAskedInfo.receiveOtherSchool) {
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

      await this.adminService.sendPushNotification(
        targetUserId,
        '💬 질문이 도착했어요',
        `${askedQuestion.isAnonymous ? '익명으로 누군가 질문을 남겼어요' : `${user.name}님으로부터 질문이 도착했어요`}`,
        {
          type: 'openstacks',
          url: ['/asked', `/asked/${targetUserId}/${createdAsked.id}`],
        },
      );

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

  public updateAsked = async (user: User, asked: AskedUpdateDto): Promise<any> => {
    try {
      const findAskedUser = await this.askedUser.findUnique({
        where: {
          userId: user.id,
        },
      });

      if (!findAskedUser) throw new HttpException(404, '찾을 수 없는 질문입니다.');

      if (asked.id) {
        if (findAskedUser.lastUpdateCustomId && findAskedUser.lastUpdateCustomId.getTime() + 1000 * 60 * 60 * 24 * 30 > new Date().getTime())
          throw new HttpException(403, '아이디는 한달에 한번만 변경할 수 있습니다.');

        const alreadyAsked = await this.askedUser.findFirst({
          where: {
            customId: asked.id,
          },
        });

        if (alreadyAsked) throw new HttpException(403, '이미 사용중인 아이디입니다.');

        await this.askedUser.update({
          where: {
            userId: user.id,
          },
          data: {
            lastUpdateCustomId: new Date(),
            customId: asked.id,
          },
        });
      }

      if (asked.tag1 && asked.tag2) {
        await this.askedUser.update({
          where: {
            userId: user.id,
          },
          data: {
            tags: [asked.tag1, asked.tag2],
          },
        });
      }

      if (typeof asked.receiveOtherSchool === 'boolean') {
        await this.askedUser.update({
          where: {
            userId: user.id,
          },
          data: {
            receiveOtherSchool: asked.receiveOtherSchool,
          },
        });
      }
    } catch (error) {
      logger.error(error);
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

    await this.asked.update({
      where: {
        id: askedId,
      },
      data: {
        answer: answer.answer,
        process: Process.success,
        answerTimeAt: new Date(),
      },
    });

    const updatedAsked = await this.getAskedById(askedId);

    await this.adminService.sendPushNotification(
      updatedAsked.userId,
      '📢 답장이 도착했어요',
      `${updatedAsked.askedUser.user.name}님으로부터 답장이 도착했어요`,
      {
        type: 'openstacks',
        url: ['/asked', `/asked/${updatedAsked.askedUserId}`],
      },
    );

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

  public async askedCount(user: User): Promise<number> {
    try {
      return await this.asked.count({
        where: {
          askedUserId: user.id,
        },
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  }

  public async updateAskedProfile(user: User, askedProfile: Express.MulterS3.File): Promise<any> {
    try {
      const findAskedInfo = await this.askedUser.findUnique({
        where: {
          userId: user.id,
        },
      });

      if (findAskedInfo.userId !== user.id) throw new HttpException(403, '권한이 없습니다.');

      if (findAskedInfo.image) {
        await deleteImage(findAskedInfo.image);
      }

      const updatedAsked = await this.askedUser.update({
        where: {
          userId: user.id,
        },
        data: {
          image: askedProfile.key,
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
  }
}
