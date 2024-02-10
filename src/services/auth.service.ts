import { decode, sign, verify } from 'jsonwebtoken';
import qs from 'qs';
import axios, { AxiosError } from 'axios';
import bcrypt from 'bcrypt';
import { Image, School, SocialLogin, SocialLoginProviderType, User, UserSchool, UserSchoolVerify } from '@prisma/client';
import {
  APPLE_BUNDLE_ID,
  APPLE_KEY_ID,
  APPLE_TEAM_ID,
  DOMAIN,
  GOOGLE_CLIENT_KEY,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  INSTAGRAM_CLIENT_KEY,
  INSTAGRAM_CLIENT_SECRET,
  INSTAGRAM_REDIRECT_URI,
  RIOT_API_KEY,
  RIOT_CLIENT_KEY,
  RIOT_CLIENT_SECRET,
  RIOT_REDIRECT_URI,
  SECRET_KEY,
} from '@config';
import fs from 'fs';
import { HttpException } from '@exceptions/HttpException';
import { DataStoredInToken, TokenData, UserWithSchool } from '@interfaces/auth.interface';
import { excludeUserPassword } from '@utils/util';
import { connectAccountMap, tierOfPoint } from '@/utils/constants';
import { CreateUserDto, LoginUserDto, VerifyPhoneCodeDto } from '@/dtos/users.dto';
import { SchoolService } from './school.service';
import { deleteImage } from '@/utils/multer';
import { AdminService } from './admin.service';
import Container, { Service } from 'typedi';
import { PrismaClientService } from './prisma.service';
import FormData from 'form-data';
import eventEmitter from '@/utils/eventEmitter';
import { LeagueOfLegendsStats } from '@/types';
import dayjs from 'dayjs';
import { logger } from '@/utils/logger';

@Service()
export class AuthService {
  private schoolService = Container.get(SchoolService);
  private adminService = Container.get(AdminService);
  private connectionAccount = Container.get(PrismaClientService).connectionAccount;
  private image = Container.get(PrismaClientService).image;
  private fight = Container.get(PrismaClientService).fight;
  private fightRankingUser = Container.get(PrismaClientService).fightRankingUser;
  private socialLogin = Container.get(PrismaClientService).socialLogin;
  private users = Container.get(PrismaClientService).user;
  private phoneVerifyRequest = Container.get(PrismaClientService).phoneVerifyRequest;
  private schoolVerify = Container.get(PrismaClientService).userSchoolVerify;
  private pushDevice = Container.get(PrismaClientService).pushDevice;
  private AppleKey = fs.readFileSync('./AppleAuthKey.p8', 'utf-8');

  // private lastCookie: string;

  public async meSchool(userData: User): Promise<
    UserSchool & {
      school: School;
    }
  > {
    const findUser = await this.users.findUnique({
      where: {
        id: userData.id,
      },
      include: {
        userSchool: true,
      },
    });
    if (!findUser.userSchoolId) throw new HttpException(400, '학교 인증을 마치지 않았습니다.');

    const findSchool = await this.schoolService.getSchoolInfoById(findUser.userSchool.schoolId);

    return {
      ...findUser.userSchool,
      school: findSchool,
    };
  }

  public async appleLogin(
    code: string,
    name: string,
  ): Promise<{
    cookie: string;
    findUser: User & {
      userSchool: UserSchool & {
        school: School;
      };
    };
    token: {
      accessToken: string;
      expiresIn: number;
    };
    registered: boolean;
  }> {
    try {
      const formData = qs.stringify({
        client_id: APPLE_BUNDLE_ID,
        client_secret: this.createAppleToken(),
        grant_type: 'authorization_code',
        code: code,
      });

      const { data: appleTokenData } = await axios.post('https://appleid.apple.com/auth/token', formData);

      const { access_token, id_token } = appleTokenData;
      const decoded = decode(id_token) as {
        sub: string;
        email: string;
      };

      const socialLogin = await this.socialLogin.findUnique({
        where: {
          socialId: decoded.sub,
        },
      });
      if (!socialLogin) {
        const createUserData: User = await this.users.create({
          data: {
            email: decoded.email,
            name: name,
            provider: 'social',
            socialLogin: {
              create: {
                provider: 'apple',
                socialId: decoded.sub,
                accessToken: access_token as string,
              },
            },
          },
          include: {
            userSchool: true,
            socialLogin: true,
          },
        });
        const loginData = await this.initializeLoginData(createUserData, false);
        return loginData;
      } else {
        const findUser = await this.users.update({
          where: {
            id: socialLogin.userId,
          },
          data: {
            email: decoded.email,
          },
          include: {
            userSchool: true,
            socialLogin: true,
          },
        });
        const loginData = await this.initializeLoginData(findUser, true);
        return loginData;
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        console.log(error);
        throw new HttpException(400, error.response.data.message);
      } else {
        throw new HttpException(400, '애플 로그인에 실패했습니다.');
      }
    }
  }

  public async kakaoLogin(code: string): Promise<{
    cookie: string;
    findUser: User & {
      userSchool: UserSchool & {
        school: School;
      };
    };
    token: {
      accessToken: string;
      expiresIn: number;
    };
    registered: boolean;
  }> {
    try {
      const { data: userData } = await axios.post(
        'https://kapi.kakao.com/v2/user/me',
        {
          property_keys: ['kakao_account', 'profile'],
        },
        {
          headers: {
            Authorization: `Bearer ${code}`,
          },
        },
      );

      const socialLogin = await this.socialLogin.findUnique({
        where: {
          socialId: userData.id.toString(),
        },
      });
      if (!socialLogin) {
        const createUserData: User = await this.users.create({
          data: {
            email: userData.kakao_account.email as string,
            name: userData.kakao_account.profile.nickname as string,
            provider: 'social',
            socialLogin: {
              create: {
                provider: 'kakao',
                socialId: userData.id.toString(),
                accessToken: code as string,
              },
            },
          },
          include: {
            userSchool: true,
            socialLogin: true,
          },
        });
        const loginData = await this.initializeLoginData(createUserData, false);
        return loginData;
      } else {
        const findUser = await this.users.update({
          where: {
            id: socialLogin.userId,
          },
          data: {
            email: userData.kakao_account.email as string,
          },
          include: {
            userSchool: true,
            socialLogin: true,
          },
        });
        const loginData = await this.initializeLoginData(findUser, true);
        return loginData;
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new HttpException(400, error.response.data.msg);
      }
      throw new HttpException(400, error);
    }
  }

  public async meSchoolVerify(userData: User): Promise<UserSchoolVerify[]> {
    const schoolverifyList = await this.schoolVerify.findMany({
      where: {
        userId: userData.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return schoolverifyList;
  }

  public async connectLeagueoflegendsCallback(user: User, code: string): Promise<any> {
    try {
      const { data } = await axios({
        method: 'POST',
        url: 'https://auth.riotgames.com/token',
        auth: {
          username: RIOT_CLIENT_KEY,
          password: RIOT_CLIENT_SECRET,
        },
        data: new URLSearchParams({
          grant_type: 'authorization_code',
          redirect_uri: RIOT_REDIRECT_URI,
          code: code,
        }),
      });

      const { access_token } = data;

      try {
        const { data: userData } = await axios.get('https://kr.api.riotgames.com/lol/summoner/v4/summoners/me', {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });

        const { id, name } = userData;

        const connectionAccount = await this.connectionAccount.findFirst({
          where: {
            userId: user.id,
            provider: connectAccountMap.leagueoflegends,
          },
        });

        const hasConnectionAccount = await this.connectionAccount.findFirst({
          where: {
            provider: connectAccountMap.leagueoflegends,
            accountId: id,
          },
        });

        if (hasConnectionAccount && hasConnectionAccount.userId !== user.id) {
          throw new HttpException(409, '이미 연동된 계정입니다.');
        }

        try {
          const { data: userDetail } = await axios.get<LeagueOfLegendsStats[]>(
            `https://kr.api.riotgames.com/lol/league/v4/entries/by-summoner/${id}`,
            {
              headers: {
                'X-Riot-Token': RIOT_API_KEY,
              },
            },
          );

          const leagueRank = userDetail.find(league => league.queueType === 'RANKED_SOLO_5x5');

          if (!leagueRank) {
            throw new HttpException(400, '랭크게임 기록이 없는 소환사입니다');
          }

          const chnageTierText = leagueRank.tier[0].toUpperCase() + leagueRank.tier.slice(1).toLowerCase();
          const tierOfPointChange =
            tierOfPoint[
              chnageTierText == 'Master' || chnageTierText == 'Grandmaster' || chnageTierText == 'Challenger'
                ? chnageTierText
                : `${chnageTierText} ${leagueRank.rank.toUpperCase()}`
            ];

          if (connectionAccount) {
            await this.connectionAccount.update({
              where: {
                id: connectionAccount.id,
              },
              data: {
                accountId: id,
                accessToken: access_token,
                name: name,
                followerCount: tierOfPointChange,
                additonalInfo:
                  chnageTierText == 'Master' || chnageTierText == 'Grandmaster' || chnageTierText == 'Challenger'
                    ? chnageTierText
                    : `${chnageTierText} ${leagueRank.rank.toUpperCase()}`,
              },
            });

            if (connectionAccount.accountId !== id) {
              const leagueoflegendsRanking = await this.fight.findMany({
                where: {
                  needTo: {
                    has: connectAccountMap.leagueoflegends,
                  },
                },
              });

              const leagueoflegendsRankingUser = await this.fightRankingUser.findMany({
                where: {
                  fightId: {
                    in: leagueoflegendsRanking.map(fight => fight.id),
                  },
                  userId: user.id,
                },
              });

              if (leagueoflegendsRankingUser.length > 0) {
                await this.fightRankingUser.updateMany({
                  where: {
                    id: {
                      in: leagueoflegendsRankingUser.map(fight => fight.id),
                    },
                  },
                  data: {
                    score: tierOfPointChange,
                  },
                });
              }
            }
          } else {
            await this.connectionAccount.create({
              data: {
                provider: connectAccountMap.leagueoflegends,
                accountId: id,
                name: name,
                accessToken: access_token,
                followerCount: tierOfPointChange,
                userId: user.id,
                additonalInfo:
                  chnageTierText == 'Master' || chnageTierText == 'Grandmaster' || chnageTierText == 'Challenger'
                    ? chnageTierText
                    : `${chnageTierText} ${leagueRank.rank.toUpperCase()}`,
              },
            });
          }
        } catch (error) {
          if (error instanceof AxiosError) {
            if (error.response.status === 401) {
              throw new HttpException(401, '소환사 정보를 가져올 수 없습니다.');
            } else if (error.response.status === 404) {
              throw new HttpException(404, '가입되지 않은 소환사입니다.');
            } else {
              throw new HttpException(500, error.response.data.status.message);
            }
          } else if (error instanceof HttpException) {
            throw error;
          }
        }
      } catch (error) {
        if (error instanceof AxiosError) {
          if (error.response.status === 401) {
            throw new HttpException(401, '소환사 정보를 가져올 수 없습니다.');
          } else if (error.response.status === 404) {
            throw new HttpException(404, '가입되지 않은 소환사입니다.');
          } else {
            throw new HttpException(500, error.response.data.status.message);
          }
        } else if (error instanceof HttpException) {
          throw error;
        }
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new HttpException(400, error.response.data.status.message);
      } else if (error instanceof HttpException) {
        throw error;
      }
    }
  }

  public async instagramLoginCallback(user: UserWithSchool, code: string): Promise<any> {
    const formData = new FormData();
    formData.append('client_id', INSTAGRAM_CLIENT_KEY);
    formData.append('client_secret', INSTAGRAM_CLIENT_SECRET);
    formData.append('grant_type', 'authorization_code');
    formData.append('redirect_uri', INSTAGRAM_REDIRECT_URI);
    formData.append('code', code);

    try {
      const { data } = await axios.post('https://api.instagram.com/oauth/access_token', formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      const { access_token, user_id } = data;

      const { data: userData } = await axios.get('https://graph.instagram.com/me', {
        params: {
          fields: 'id,username',
          access_token: access_token,
        },
      });

      const connectionAccount = await this.connectionAccount.findFirst({
        where: {
          userId: user.id,
          provider: connectAccountMap.instagram,
        },
      });

      const hasConnectionAccount = await this.connectionAccount.findFirst({
        where: {
          provider: connectAccountMap.instagram,
          accountId: String(user_id),
        },
      });

      if (hasConnectionAccount && hasConnectionAccount.userId !== user.id) {
        throw new HttpException(409, '이미 연동된 계정입니다.');
      }

      const {
        data: userDetail,
        // headers
      } = await axios.get(`https://i.instagram.com/api/v1/users/web_profile_info/?username=${userData.username}`, {
        headers: {
          'x-ig-app-id': '936619743392459',
          accept: '*/*',
          'accept-language': 'en-US,en;q=0.9',
          referer: `https://www.instagram.com/${userData.username}/`,
          'sec-ch-prefers-color-scheme': 'dark',
          'sec-ch-ua': '"Not?A_Brand";v="8", "Chromium";v="108", "Microsoft Edge";v="108"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'x-ig-www-claim': '0',
          'x-requested-with': 'XMLHttpRequest',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.1080.0 Safari/537.36 Edg/108.0.1080.0',
          // cookie: this.lastCookie,
        },
      });

      // if (headers) {
      //   this.lastCookie = headers['set-cookie'].map((cookie: string) => {
      //     if (/__to_be_deleted__/g.test(cookie)) return null;
      //     return cookie.split(';')[0];
      //   })
      //     .filter(cookie => cookie)
      //     .join('; ');
      // }

      if (connectionAccount) {
        await this.connectionAccount.update({
          where: {
            id: connectionAccount.id,
          },
          data: {
            accountId: String(user_id),
            accessToken: access_token,
            name: userData.username,
            followerCount: userDetail.data?.user.edge_followed_by.count || 0,
          },
        });

        if (connectionAccount.accountId !== String(user_id)) {
          const instagramRanking = await this.fight.findMany({
            where: {
              needTo: {
                has: connectAccountMap.instagram,
              },
            },
          });

          const instagramRankingUser = await this.fightRankingUser.findMany({
            where: {
              fightId: {
                in: instagramRanking.map(fight => fight.id),
              },
              userId: user.id,
            },
          });

          if (instagramRankingUser.length > 0) {
            await this.fightRankingUser.updateMany({
              where: {
                id: {
                  in: instagramRankingUser.map(fight => fight.id),
                },
              },
              data: {
                score: userDetail.data?.user.edge_followed_by.count || 0,
              },
            });
          }
        }
      } else {
        await this.connectionAccount.create({
          data: {
            provider: connectAccountMap.instagram,
            accountId: String(user_id),
            name: userData.username,
            accessToken: access_token,
            followerCount: userDetail.data?.user.edge_followed_by.count,
            userId: user.id,
          },
        });
      }

      return {
        followersCount: userDetail.data?.user.edge_followed_by.count,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  public async disconnectInstagramAccount(userData: User): Promise<boolean> {
    const connectionAccount = await this.connectionAccount.findFirst({
      where: {
        userId: userData.id,
        provider: connectAccountMap.instagram,
      },
    });

    if (!connectionAccount) throw new HttpException(400, '연동된 계정이 없습니다.');

    await this.connectionAccount.delete({
      where: {
        id: connectionAccount.id,
      },
    });

    const joinFightList = await this.fight.findMany({
      where: {
        needTo: {
          has: connectAccountMap.instagram,
        },
      },
      select: {
        fightRankingUser: {
          where: {
            userId: userData.id,
          },
        },
      },
    });

    if (joinFightList.length > 0) {
      await this.fightRankingUser.deleteMany({
        where: {
          id: {
            in: joinFightList.map(fight => fight.fightRankingUser.map(user => user.id)).flat(),
          },
        },
      });
    }

    return true;
  }

  public async disconnectLeagueoflegendsAccount(userData: User): Promise<boolean> {
    const connectionAccount = await this.connectionAccount.findFirst({
      where: {
        userId: userData.id,
        provider: connectAccountMap.leagueoflegends,
      },
    });

    if (!connectionAccount) throw new HttpException(400, '연동된 계정이 없습니다.');

    await this.connectionAccount.delete({
      where: {
        id: connectionAccount.id,
      },
    });

    const joinFightList = await this.fight.findMany({
      where: {
        needTo: {
          has: connectAccountMap.leagueoflegends,
        },
      },
      select: {
        fightRankingUser: {
          where: {
            userId: userData.id,
          },
        },
      },
    });

    if (joinFightList.length > 0) {
      await this.fightRankingUser.deleteMany({
        where: {
          id: {
            in: joinFightList.map(fight => fight.fightRankingUser.map(user => user.id)).flat(),
          },
        },
      });
    }

    return true;
  }

  public async meConnectAccount(userData: User): Promise<any> {
    const connectionAccount = await this.connectionAccount.findMany({
      where: {
        userId: userData.id,
      },
    });

    return connectionAccount;
  }

  public async googleLogin(code: string): Promise<{
    cookie: string;
    findUser: User & {
      userSchool: UserSchool & {
        school: School;
      };
    };
    token: {
      accessToken: string;
      expiresIn: number;
    };
    registered: boolean;
  }> {
    const query = qs.stringify({
      code,
      client_id: GOOGLE_CLIENT_KEY,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    try {
      const { data } = await axios.post('https://oauth2.googleapis.com/token', query, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const { data: userData } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });

      const socialLogin = await this.socialLogin.findUnique({
        where: {
          socialId: userData.id as string,
        },
      });

      if (!socialLogin) {
        const createUserData: User = await this.users.create({
          data: {
            email: userData.email as string,
            name: userData.name as string,
            provider: 'social',
            socialLogin: {
              create: {
                provider: 'google',
                socialId: userData.id as string,
                accessToken: data.access_token as string,
              },
            },
          },
          include: {
            userSchool: true,
            socialLogin: true,
          },
        });

        const loginData = await this.initializeLoginData(createUserData, false);
        return loginData;
      } else {
        const findUser = await this.users.findUnique({
          where: {
            id: socialLogin.userId,
          },
          include: {
            userSchool: true,
            socialLogin: true,
          },
        });
        const loginData = await this.initializeLoginData(findUser, true);
        return loginData;
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new HttpException(400, error.response.data.message);
      }
      throw new HttpException(400, error);
    }
  }

  public async uploadImage(user: User, file?: Express.MulterS3.File): Promise<string> {
    if (!file) throw new HttpException(500, '사진 업로드를 실패했습니다.');

    const createImage = await this.image.create({
      data: {
        key: file.key,
        userId: user.id,
      },
    });

    return createImage.id;
  }

  private async initializeLoginData(
    user: User & {
      userSchool?: UserSchool & {
        school?: School;
      };
    },
    registered: boolean,
  ): Promise<{
    cookie: string;
    findUser: User & {
      userSchool: UserSchool & {
        school: School;
      };
      socialLogin?: SocialLogin;
    };
    token: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
    registered: boolean;
  }> {
    const passwordRemovedData = excludeUserPassword(user, ['password']);

    const tokenData = this.createToken(user);
    const refreshToken = this.createToken(user, 15);
    const cookie = this.createCookie(tokenData);

    if (user.userSchool) {
      const findSchool = await this.schoolService.getSchoolInfoById(user.userSchool.schoolId);

      return {
        cookie,
        findUser: {
          ...passwordRemovedData,
          userSchool: {
            ...user.userSchool,
            school: findSchool,
          },
        } as any,
        token: {
          accessToken: tokenData.token,
          refreshToken: refreshToken.token,
          expiresIn: tokenData.expiresIn,
        },
        registered,
      };
    }

    return {
      cookie,
      findUser: {
        ...passwordRemovedData,
        userSchool: null,
      } as any,
      token: {
        accessToken: tokenData.token,
        refreshToken: refreshToken.token,
        expiresIn: tokenData.expiresIn,
      },
      registered,
    };
  }

  public async getMe(userData: UserWithSchool): Promise<any> {
    const passwordRemovedData = excludeUserPassword(userData, ['password']);
    if (userData.userSchoolId) {
      const findSchool = await this.schoolService.getSchoolInfoById(userData.userSchoolId);

      return {
        ...passwordRemovedData,
        userSchool: {
          ...userData.userSchool,
          school: findSchool,
        },
      };
    }

    return {
      ...passwordRemovedData,
      userSchool: null,
    };
  }

  public async appToken(
    accessToken: string,
    pushToken?: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    verfiyed: boolean;
  }> {
    let verificationResponse: DataStoredInToken;
    try {
      verificationResponse = verify(accessToken, SECRET_KEY) as DataStoredInToken;
    } catch (error) {
      throw new HttpException(409, '만료된 토큰입니다.');
    }

    if (!verificationResponse) throw new HttpException(409, '만료된 토큰입니다.');

    const userId = verificationResponse.id;

    const findUser = await this.users.findUnique({
      where: {
        id: userId,
      },
    });

    if (!findUser) throw new HttpException(409, '가입되지 않은 사용자입니다.');

    if (pushToken) {
      const pushDeviceData = await this.pushDevice.findFirst({
        where: {
          token: pushToken,
        },
      });

      if (!pushDeviceData) {
        await this.pushDevice.create({
          data: {
            token: pushToken,
            userId: findUser.id,
          },
        });
      } else {
        await this.pushDevice.update({
          where: {
            id: pushDeviceData.id,
          },
          data: {
            userId: findUser.id,
          },
        });
      }
    }

    const tokenData = this.createToken(findUser);
    const refreshTokenData = this.createToken(findUser, 15);

    return {
      accessToken: tokenData.token,
      refreshToken: refreshTokenData.token,
      verfiyed: findUser.userSchoolId ? true : false,
    };
  }

  public async appRefreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    verfiyed: boolean;
  }> {
    let verificationResponse: DataStoredInToken;
    try {
      verificationResponse = verify(refreshToken, SECRET_KEY) as DataStoredInToken;
    } catch (error) {
      throw new HttpException(409, '만료된 토큰입니다.');
    }

    if (!verificationResponse) throw new HttpException(409, '만료된 토큰입니다.');

    const userId = verificationResponse.id;

    const findUser = await this.users.findUnique({
      where: {
        id: userId,
      },
    });

    if (!findUser) throw new HttpException(409, '가입되지 않은 사용자입니다.');

    const tokenData = this.createToken(findUser);
    const refreshTokenData = this.createToken(findUser, 15);

    return {
      accessToken: tokenData.token,
      refreshToken: refreshTokenData.token,
      verfiyed: findUser.userSchoolId ? true : false,
    };
  }

  public async appLogin(token: string): Promise<any> {
    let verificationResponse: DataStoredInToken;
    try {
      verificationResponse = verify(token, SECRET_KEY) as DataStoredInToken;
    } catch (error) {
      throw new HttpException(409, '만료된 토큰입니다.');
    }

    if (!verificationResponse) throw new HttpException(409, '만료된 토큰입니다.');

    const userId = verificationResponse.id;

    const findUser = await this.users.findUnique({
      where: {
        id: userId,
      },
      include: {
        userSchool: true,
        socialLogin: true,
      },
    });

    if (!findUser) throw new HttpException(409, '가입되지 않은 사용자입니다.');

    const loginData = await this.initializeLoginData(findUser, true);

    return loginData;
  }

  public async login(userData: LoginUserDto): Promise<any> {
    const findUser = await this.users.findUnique({
      where: {
        phone: userData.phone,
      },
      include: {
        userSchool: true,
      },
    });
    if (!findUser) throw new HttpException(409, '가입되지 않은 사용자입니다.');

    const isPasswordMatching: boolean = await bcrypt.compare(userData.password, findUser.password);
    if (!isPasswordMatching) throw new HttpException(409, '비밀번호가 일치하지 않습니다.');

    const loginData = await this.initializeLoginData(findUser, true);

    return loginData;
  }

  public async signUp(userData: CreateUserDto): Promise<User> {
    const findPhone = await this.phoneVerifyRequest.findUnique({
      where: {
        id: userData.token,
      },
    });
    if (findPhone.code !== userData.code) throw new HttpException(400, '인증번호가 일치하지 않습니다.');

    const findUser = await this.users.findUnique({
      where: {
        phone: userData.phone,
      },
    });
    if (findUser) throw new HttpException(409, '이미 가입된 전화번호입니다.');

    if (userData.provider === 'id') {
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const createUserData = await this.users.create({
        data: {
          phone: userData.phone,
          name: userData.name,
          // email: userData.email,
          provider: 'id',
          password: hashedPassword,
          isVerified: true,
          agreement: {
            create: {
              receive: userData.marketingAgree,
            },
          },
        },
      });

      const passwordRemovedData = excludeUserPassword(createUserData, ['password']);

      return passwordRemovedData as User;
    }

    const findSocialUser = await this.socialLogin.findUnique({
      where: {
        socialId: userData.socialId,
      },
      select: {
        user: true,
      },
    });
    if (findSocialUser.user.isVerified) throw new HttpException(409, '이미 가입된 소셜 아이디가 있습니다.');

    const updateUser = await this.users.update({
      where: {
        id: findSocialUser.user.id,
      },
      data: {
        // email: userData.email,
        name: userData.name,
        phone: userData.phone,
        isVerified: true,
        agreement: {
          upsert: {
            create: {
              receive: userData.marketingAgree,
            },
            update: {
              receive: userData.marketingAgree,
            },
          },
        },
      },
    });

    const passwordRemovedData = excludeUserPassword(updateUser, ['password']);

    return passwordRemovedData as User;
  }

  public async updatePassword(userData: User, password: string, newPassword: string): Promise<boolean> {
    const findUser = await this.users.findUnique({
      where: {
        id: userData.id,
      },
    });
    if (!findUser) throw new HttpException(409, '가입되지 않은 사용자입니다.');
    if (findUser.provider !== 'id') throw new HttpException(409, '소셜 로그인 사용자는 비밀번호를 변경할 수 없습니다.');

    const isPasswordMatching: boolean = await bcrypt.compare(password, findUser.password);
    if (!isPasswordMatching) throw new HttpException(409, '비밀번호가 일치하지 않습니다.');

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.users.update({
      where: {
        id: userData.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    return true;
  }

  public async updateEmail(userData: User, email: string): Promise<boolean> {
    const findUser = await this.users.findUnique({
      where: {
        id: userData.id,
      },
    });

    if (!findUser) throw new HttpException(409, '가입되지 않은 사용자입니다.');

    await this.users.update({
      where: {
        id: userData.id,
      },
      data: {
        email,
      },
    });

    return true;
  }

  public async deleteUser(userData: User, verfiyDto: VerifyPhoneCodeDto): Promise<boolean> {
    await this.verifyPhoneCode(verfiyDto.phone, verfiyDto.code, verfiyDto.token);

    const findUser = await this.users.findUnique({
      where: {
        id: userData.id,
      },
      include: {
        socialLogin: true,
      },
    });

    if (!findUser) throw new HttpException(409, '가입되지 않은 사용자입니다.');

    if (findUser.socialLogin && findUser.socialLogin.provider === SocialLoginProviderType.apple) {
      try {
        const tokenformData = qs.stringify({
          client_id: APPLE_BUNDLE_ID,
          client_secret: this.createAppleToken(),
          grant_type: 'authorization_code',
          code: verfiyDto.applelogoutcode,
        });

        const { data: appleTokenData } = await axios.post('https://appleid.apple.com/auth/token', tokenformData);
        const { access_token } = appleTokenData;

        const revokeformData = qs.stringify({
          client_id: APPLE_BUNDLE_ID,
          client_secret: this.createAppleToken(),
          token: access_token,
        });

        await axios.post('https://appleid.apple.com/auth/revoke', revokeformData);
      } catch (error) {
        logger.error(JSON.stringify(error));
        throw new HttpException(400, '애플계정 탈퇴중 오류가 발생했습니다.');
      }
    }

    await this.users.delete({
      where: {
        id: userData.id,
      },
    });

    return true;
  }

  public async updateProfile(userData: User, file: Express.MulterS3.File): Promise<string> {
    if (userData.profile) {
      await deleteImage(userData.profile);
    }

    if (!file) {
      await this.users.update({
        where: {
          id: userData.id,
        },
        data: {
          profile: null,
        },
      });

      return null;
    }

    await this.users.update({
      where: {
        id: userData.id,
      },
      data: {
        profile: file.key,
      },
    });

    eventEmitter.emit('imageResize', file.key, 'profile');

    return file.key;
  }

  public async updateNickname(userData: User, newNickname: string): Promise<boolean> {
    await this.users.update({
      where: {
        id: userData.id,
      },
      data: {
        name: newNickname,
      },
    });

    return true;
  }

  public async sendVerifyMessage(phone: string, authed: boolean): Promise<string> {
    if (!authed) {
      const findUser = await this.users.findUnique({
        where: {
          phone: phone,
        },
      });
      if (findUser) throw new HttpException(409, '이미 가입된 전화번호입니다.');
    }

    const verifyCode = Math.floor(100000 + Math.random() * 9000).toString();

    const verifyPhone = await this.phoneVerifyRequest.create({
      data: {
        phone,
        code: verifyCode,
      },
    });

    try {
      await this.adminService.sendMessage('VERIFY_MESSAGE', phone, {
        '#{인증번호}': verifyCode,
      });
    } catch (error) {
      throw new HttpException(400, '메시지 전송에 실패했습니다.');
    }

    return verifyPhone.id;
  }

  public async findPasswordUpdatePassword(phone: string, password: string, code: string, token: string): Promise<boolean> {
    const checkPhone = await this.verifyPhoneCode(phone, code, token);
    if (!checkPhone) throw new HttpException(400, '인증번호가 일치하지 않습니다.');

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.users.update({
      where: {
        phone: phone,
      },
      data: {
        password: hashedPassword,
      },
    });

    return true;
  }

  public async findPasswordSendSms(phone: string): Promise<string> {
    const findUser = await this.users.findUnique({
      where: {
        phone: phone,
      },
    });
    if (!findUser) throw new HttpException(400, '가입되지 않은 전화번호입니다.');

    const verifyCode = Math.floor(100000 + Math.random() * 9000).toString();

    const verifyPhone = await this.phoneVerifyRequest.create({
      data: {
        phone,
        code: verifyCode,
      },
    });

    try {
      await this.adminService.sendMessage('VERIFY_MESSAGE', phone, {
        '#{인증번호}': verifyCode,
      });
    } catch (error) {
      throw new HttpException(400, '메시지 전송에 실패했습니다.');
    }

    return verifyPhone.id;
  }

  public async verifyPhoneCode(phone: string, code: string, token: string): Promise<boolean> {
    const verifyPhone = await this.phoneVerifyRequest.findUnique({
      where: {
        id: token,
      },
    });

    if (!verifyPhone) throw new HttpException(400, '인증번호가 만료되었습니다.');

    if (verifyPhone.phone !== phone) throw new HttpException(400, '인증번호가 일치하지 않습니다.');

    if (verifyPhone.code !== code) throw new HttpException(400, '인증번호가 일치하지 않습니다.');

    return true;
  }

  public async ouathLoginVerifyPhone(user: User, oauthRegisterDto: VerifyPhoneCodeDto): Promise<boolean> {
    const verifyPhone = await this.verifyPhoneCode(oauthRegisterDto.phone, oauthRegisterDto.code, oauthRegisterDto.token);

    if (!verifyPhone) throw new HttpException(400, '인증번호가 일치하지 않습니다.');

    await this.users.update({
      where: {
        id: user.id,
      },
      data: {
        phone: oauthRegisterDto.phone,
        isVerified: true,
        agreement: {
          upsert: {
            create: {
              receive: oauthRegisterDto.marketingAgree,
            },
            update: {
              receive: oauthRegisterDto.marketingAgree,
            },
          },
        },
      },
    });

    return true;
  }

  public async deleteImage(imageId: string, userData: User): Promise<Image> {
    const findImage = await this.image.findUnique({
      where: {
        id: imageId,
      },
    });
    if (!findImage) throw new HttpException(400, '이미지를 찾을 수 없습니다');
    if (findImage.userId !== userData.id) throw new HttpException(400, '이미지를 삭제할 권한이 없습니다');

    await deleteImage(findImage.key);

    return findImage;
  }

  public createToken(user: User, expires?: number): TokenData {
    const dataStoredInToken: DataStoredInToken = { id: user.id };
    const secretKey: string = SECRET_KEY;
    const expiresIn: number = 60 * 60 * 24 * (expires || 7);

    return { expiresIn, token: sign(dataStoredInToken, secretKey, { expiresIn }) };
  }

  public createCookie(tokenData: TokenData): string {
    return `Authorization=${tokenData.token}; HttpOnly; Max-Age=${tokenData.expiresIn}; Domain=${DOMAIN}; Path=/`;
  }

  private createAppleToken(): string {
    const payload = {
      iss: APPLE_TEAM_ID,
      iat: dayjs().unix(),
      exp: dayjs().add(10, 'minute').unix(),
      aud: 'https://appleid.apple.com',
      sub: APPLE_BUNDLE_ID,
    };

    const header = {
      alg: 'ES256',
      kid: APPLE_KEY_ID,
    };

    return sign(payload, this.AppleKey, { algorithm: 'ES256', header });
  }
}
