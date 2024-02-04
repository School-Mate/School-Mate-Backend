import { HttpException } from '@/exceptions/HttpException';
import { Service, Container } from 'typedi';
import { PrismaClientService } from './prisma.service';
import { UserWithSchool } from '@/interfaces/auth.interface';
import { maskName } from '@/utils/util';

@Service()
export class FightService {
  private fight = Container.get(PrismaClientService).fight;
  private fightRanking = Container.get(PrismaClientService).fightRanking;
  private fightRankingUser = Container.get(PrismaClientService).fightRankingUser;
  private connectionAccount = Container.get(PrismaClientService).connectionAccount;
  private prismaClient = Container.get(PrismaClientService);

  public async getFightList(user: UserWithSchool, page: string): Promise<any> {
    const fightList = await this.fight.findMany({
      skip: (Number(page) - 1) * 10,
      take: 10,
      orderBy: {
        startAt: 'desc',
      },
      include: {
        fightRanking: true,
      },
    });

    const fightListWithRanking = await Promise.all(
      fightList.map(async fight => {
        const fightListWithRanking = await this.fightRankingUser.groupBy({
          by: ['fightId', 'schoolId'],
          _sum: {
            score: true,
          },
          where: {
            fightId: fight.id,
            schoolId: user.userSchoolId,
          },
        });

        return {
          ...fight,
          score: fightListWithRanking[0] ? fightListWithRanking[0]._sum.score : 0,
        };
      }),
    );

    const fightCount = await this.fight.count();

    return {
      totalPage: fightCount === 0 ? 1 : Math.ceil(fightCount / 10),
      numberPage: page ? Number(page) : 1,
      contents: fightListWithRanking,
    };
  }

  public async fightRankingByFightId(user: UserWithSchool, fightId: string): Promise<any> {
    const fight = await this.fight.findUnique({
      where: {
        id: fightId,
      },
    });

    const fightRanking = (await this.prismaClient.$queryRaw`
      SELECT
        FR.id AS rankingId,
        FR."schoolId",
        SUM(FRU.score) AS totalScore
      FROM
        "FightRanking" FR
      JOIN
        "FightRankingUser" FRU ON FRU."fightRankingId" = FR.id
      WHERE
        FR."fightId" = ${fightId}
      GROUP BY
        FR.id, FR."schoolId"
      ORDER BY
        totalScore DESC
      LIMIT 30 
    `) as {
      rankingId: string;
      schoolId: string;
      totalscore: string;
    }[];

    const fightRankingWithSchool = await Promise.all(
      fightRanking.map(async ranking => {
        const school = await this.prismaClient.school.findUnique({
          where: {
            schoolId: ranking.schoolId,
          },
        });

        return {
          rankingid: ranking.rankingId,
          schoolId: ranking.schoolId,
          school: school,
          totalScore: Number(ranking.totalscore),
        };
      }),
    );

    const isRegistration = await this.fightRankingUser.findFirst({
      where: {
        fightId,
        userId: user.id,
      },
    });

    const myScore = await this.prismaClient.fightRankingUser.groupBy({
      by: ['schoolId', 'fightId'],
      _sum: {
        score: true,
      },
      where: {
        fightId,
        schoolId: user.userSchoolId,
      },
    });

    return {
      ...fight,
      ranking: fightRankingWithSchool,
      ourRanking: myScore[0] ? Number(myScore[0]._sum.score) : 0,
      isRegistration: isRegistration ? true : false,
    };
  }

  public async fightRegistration(fightId: string, user: UserWithSchool): Promise<any> {
    const findFight = await this.fight.findUnique({
      where: {
        id: fightId,
      },
    });

    if (!findFight) {
      throw new HttpException(404, '존재하지 않는 대결입니다.');
    }

    let findFightRanking = await this.fightRanking.findFirst({
      where: {
        fightId,
        schoolId: user.userSchoolId,
      },
    });

    if (!findFightRanking) {
      findFightRanking = await this.fightRanking.create({
        data: {
          fightId: findFight.id,
          schoolId: user.userSchoolId,
        },
      });
    }

    const findFightRankingUser = await this.fightRankingUser.findFirst({
      where: {
        fightId: findFightRanking.fightId,
        userId: user.id,
      },
    });

    if (findFightRankingUser) {
      throw new HttpException(403, '이미 등록된 대결입니다.');
    }

    if (findFight.needTo.includes('instagram')) {
      const findConnectionAccount = await this.connectionAccount.findFirst({
        where: {
          userId: user.id,
          provider: 'instagram',
        },
      });

      if (!findConnectionAccount) {
        throw new HttpException(403, '인스타그램 연동이 필요합니다.');
      }

      await this.fightRankingUser.create({
        data: {
          fightRankingId: findFightRanking.id,
          userId: user.id,
          fightId: findFight.id,
          score: findConnectionAccount.followerCount,
          schoolId: user.userSchoolId,
        },
      });
    } else if (findFight.needTo.includes('leagueoflegends')) {
      const findConnectionAccount = await this.connectionAccount.findFirst({
        where: {
          userId: user.id,
          provider: 'leagueoflegends',
        },
      });

      if (!findConnectionAccount) {
        throw new HttpException(403, '리그오브레전드 연동이 필요합니다.');
      }

      await this.fightRankingUser.create({
        data: {
          fightRankingId: findFightRanking.id,
          userId: user.id,
          fightId: findFight.id,
          score: findConnectionAccount.followerCount,
          schoolId: user.userSchoolId,
          additonalInfo: findConnectionAccount.additonalInfo,
        },
      });
    }

    return true;
  }

  public async fightRankingByFightIdSchool(fightId: string, schoolId: string, page: string): Promise<any> {
    const fightRanking = await this.fightRankingUser.findMany({
      skip: (Number(page) - 1) * 10,
      take: 10,
      where: {
        fightId,
        schoolId,
      },
      orderBy: {
        score: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    const fightRankingCount = await this.fightRankingUser.count({
      where: {
        fightId,
        schoolId,
      },
    });

    return {
      totalPage: Math.ceil(fightRankingCount / 10),
      numberPage: page ? Number(page) : 1,
      contents: fightRanking.map(ranking => {
        return {
          ...ranking,
          user: {
            name: maskName(ranking.user.name),
          },
          userId: undefined,
        };
      }),
    };
  }
}
