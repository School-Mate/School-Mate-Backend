import { HttpException } from '@/exceptions/HttpException';
import { Service, Container } from 'typedi';
import { PrismaClientService } from './prisma.service';
import { UserWithSchool } from '@/interfaces/auth.interface';

@Service()
export class FightService {
  public fight = Container.get(PrismaClientService).fight;
  public fightRanking = Container.get(PrismaClientService).fightRanking;
  public fightRankingUser = Container.get(PrismaClientService).fightRankingUser;
  public connectionAccount = Container.get(PrismaClientService).connectionAccount;
  public async getFightList(user: UserWithSchool, page: string): Promise<any> {
    const fightList = await this.fight.findMany({
      skip: (Number(page) - 1) * 20,
      take: 20,
      orderBy: {
        startAt: 'desc',
      },
    });

    return '';
  }

  public async fightRankingByFightId(fightId: string): Promise<any> {
    const fightRanking = await this.fight.findUnique({
      where: {
        id: fightId,
      },
    });

    return '';
  }

  public async fightRegistration(fightId: string, user: UserWithSchool): Promise<boolean> {
    const fightData = await this.fight.findUnique({
      where: {
        id: fightId,
      },
    });

    if (!fightData) {
      throw new HttpException(404, '존재하지 않는 대결입니다.');
    }

    if (fightData.needTo.includes('instagram')) {
      const connectionAccount = await this.connectionAccount.findFirst({
        where: {
          userId: user.id,
          provider: 'instagram',
        },
      });

      if (!connectionAccount) {
        throw new HttpException(40, '인스타그램 계정을 먼저 연동해주세요.');
      }

      const registraionFight = await this.fightRankingUser.findFirst({
        where: {
          fightId: fightId,
          userId: user.id,
        },
      });

      if (registraionFight) {
        await this.fightRankingUser.update({
          where: {
            id: registraionFight.id,
          },
          data: {
            score: connectionAccount.followerCount,
          },
        });
      } else {
        const fightRanking = await this.fightRanking.findFirst({
          where: {
            fightId: fightId,
          },
        });
        await this.fightRankingUser.create({
          data: {
            fightId: fightId,
            userId: user.id,
            score: connectionAccount.followerCount,
            schoolId: user.userSchoolId,
            fightRankingId: fightRanking.id,
          },
        });
      }
    }

    return true;
  }
}
