import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';
import { logger } from './logger';
import { lambdaClient } from './client';
import Container from 'typedi';
import { PrismaClientService } from '@/services/prisma.service';

type Events = {
  imageResize: (key: string, target: 'article' | 'askedprofile' | 'profile') => void;
};

const eventEmitter = new EventEmitter() as TypedEmitter<Events>;

eventEmitter.on('imageResize', async (key, target) => {
  try {
    const { data } = await lambdaClient.post('/prod/image-resize', {
      key,
    });

    if (target === 'article') {
      const targetArticle = await Container.get(PrismaClientService).article.findFirst({
        where: {
          images: {
            has: key,
          },
        },
      });

      if (targetArticle) {
        await Container.get(PrismaClientService).article.update({
          where: {
            id: targetArticle.id,
          },
          data: {
            images: {
              set: [...targetArticle.images.filter(image => image !== key), data.key],
            },
          },
        });
      }
    } else if (target === 'askedprofile') {
      const targetAskedProfile = await Container.get(PrismaClientService).askedUser.findFirst({
        where: {
          image: key,
        },
      });

      if (targetAskedProfile) {
        await Container.get(PrismaClientService).askedUser.update({
          where: {
            userId: targetAskedProfile.userId,
          },
          data: {
            image: data.key,
          },
        });
      }
    } else if (target === 'profile') {
      const targetProfile = await Container.get(PrismaClientService).user.findFirst({
        where: {
          profile: key,
        },
      });

      if (targetProfile) {
        await Container.get(PrismaClientService).user.update({
          where: {
            id: targetProfile.id,
          },
          data: {
            profile: data.key,
          },
        });
      }
    }
  } catch (e) {
    logger.error(e);
  }
});

export default eventEmitter;
