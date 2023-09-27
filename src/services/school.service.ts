import { AxiosError } from 'axios';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);

import { SchoolVerifyDto } from '@/dtos/school.dto';
import { HttpException } from '@/exceptions/HttpException';
import { IClassInfoResponse, IMealInfoResponse, ISchoolInfoResponse, ISchoolInfoRow, ITimeTableResponse } from '@/interfaces/neisapi.interface';
import { neisClient, kakaoClient } from '@/utils/client';
import { PrismaClient, School, User, Process, Meal, UserSchoolVerify } from '@prisma/client';

class SchoolService {
  public image = new PrismaClient().image;
  public userSchoolVerify = new PrismaClient().userSchoolVerify;
  public school = new PrismaClient().school;
  public user = new PrismaClient().user;
  public meal = new PrismaClient().meal;

  public async searchSchool(keyword: string): Promise<ISchoolInfoRow[]> {
    try {
      // # TODO: cashing
      // const findSchoolList = await this.school.findMany({
      //   where: {
      //     name: {
      //       contains: keyword,
      //     },
      //   },
      // });
      // if (findSchoolList) return findSchoolList;

      const { data: schoolFetch } = await neisClient.get('/hub/schoolInfo', {
        params: {
          SCHUL_NM: keyword,
        },
      });
      const schoolResponse: ISchoolInfoResponse = schoolFetch.schoolInfo;
      if (!schoolResponse) throw new HttpException(404, '해당하는 학교가 없습니다.');

      const schoolList: ISchoolInfoRow[] = schoolResponse[1].row;
      return schoolList;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else if (error instanceof AxiosError) {
        throw new HttpException(500, '나이스 서버에 오류가 발생했습니다.');
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  }

  public async getSchoolInfoById(schoolId: string): Promise<School> {
    try {
      const findSchool = await this.school.findUnique({
        where: {
          schoolId: schoolId,
        },
      });
      if (findSchool) return findSchool;

      const { data: response } = await neisClient.get('/hub/schoolInfo', {
        params: {
          SD_SCHUL_CODE: schoolId,
        },
      });
      const schoolInfo: ISchoolInfoResponse = response.schoolInfo;

      const org = schoolInfo[1].row[0].ORG_RDNMA;
      const { data: addressFetch } = await kakaoClient.get('/v2/local/search/address.json', {
        params: {
          query: org,
          analyze_type: 'similar',
        },
      });
      const addressList: IAddressDocuments[] = addressFetch.documents;

      const createSchool = await this.school.create({
        data: {
          schoolId: schoolId,
          defaultName: schoolInfo[1].row[0].SCHUL_NM,
          type: schoolInfo[1].row[0].SCHUL_KND_SC_NM,
          atptCode: schoolInfo[1].row[0].ATPT_OFCDC_SC_CODE,
          org: org,
          x: Number(addressList[0].x) as any,
          y: Number(addressList[0].y) as any,
        },
      });
      return createSchool;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else if (error instanceof AxiosError) {
        throw new HttpException(500, '나이스 서버에 오류가 발생했습니다.');
      } else {
        console.log(error);
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  }

  public async getMeal(schoolId: string, data: IMealQuery): Promise<Meal> {
    try {
      const schoolInfo = await this.getSchoolInfoById(schoolId);
      if (!schoolInfo) throw new HttpException(404, '학교를 찾을 수 없습니다.');

      const date = data.date ? dayjs(data.date).format('YYYYMMDD') : dayjs().format('YYYYMMDD');
      const findMeal = await this.meal.findUnique({
        where: {
          id: `${schoolId}_${date}_${data.mealType}`,
        },
      });
      if (findMeal) return findMeal;

      const { data: response } = await neisClient.get('/hub/mealServiceDietInfo', {
        params: {
          ATPT_OFCDC_SC_CODE: schoolInfo.atptCode,
          MMEAL_SC_CODE: data.mealType,
          SD_SCHUL_CODE: schoolId,
          MLSV_YMD: date,
        },
      });

      const mealInfo: IMealInfoResponse = response.mealServiceDietInfo;
      if (!mealInfo) throw new HttpException(404, '해당 날짜의 급식을 찾을 수 없습니다.');

      const createMeal = await this.meal.create({
        data: {
          id: `${schoolId}_${dayjs(data.date).format('YYYYMMDD')}_${data.mealType}`,
          MLSV_FGR: mealInfo[1].row[0].MLSV_FGR as any as number,
          DDISH_NM: mealInfo[1].row[0].DDISH_NM,
          ORPLC_INFO: mealInfo[1].row[0].ORPLC_INFO,
          CAL_INFO: mealInfo[1].row[0].CAL_INFO,
          NTR_INFO: mealInfo[1].row[0].NTR_INFO,
        },
      });
      return createMeal;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else if (error instanceof AxiosError) {
        throw new HttpException(500, '나이스 서버에 오류가 발생했습니다.');
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  }

  public async getTimetable(schoolId: string, data: ITimetableQuery): Promise<any> {
    try {
      const schoolInfo = await this.getSchoolInfoById(schoolId);
      if (!schoolInfo) throw new HttpException(404, '학교를 찾을 수 없습니다.');

      const endpoint = schoolInfo.type === "고등학교" ? '/hub/hisTimetable' : '/hub/misTimetable';
      const { data: response } = await neisClient.get(endpoint, {
        params: {
          ATPT_OFCDC_SC_CODE: schoolInfo.atptCode,
          SD_SCHUL_CODE: schoolId,
          GRADE: data.grade,
          CLASS_NM: data.class,
          SEM: data.semes ? data.semes : this.semesterHandler(),
          DDDEP_NM: data.dept,
          AY: data.year ? data.year : dayjs().format('YYYY'),
          ALL_TI_YMD: data.date ? dayjs(data.date).format('YYYYMMDD') : null,
        },
      });

      const timetableInfo: ITimeTableResponse = schoolInfo.type === "고등학교" ? response.hisTimetable : response.misTimetable;
      if (!timetableInfo) throw new HttpException(404, '해당하는 시간표를 찾을 수 없습니다.');

      return timetableInfo[1].row;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else if (error instanceof AxiosError) {
        throw new HttpException(500, '나이스 서버에 오류가 발생했습니다.');
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  }

  public async getClassInfo(schoolId: string): Promise<any> {
    try {
      const schoolInfo = await this.getSchoolInfoById(schoolId);
      if (!schoolInfo) throw new HttpException(404, '학교를 찾을 수 없습니다.');

      const { data: schoolDetailFetch } = await neisClient.get('/hub/classInfo', {
        params: {
          ATPT_OFCDC_SC_CODE: schoolInfo.atptCode,
          SD_SCHUL_CODE: schoolId,
          AY: dayjs().format('YYYY'),
        },
      });

      const schoolDetail: IClassInfoResponse = schoolDetailFetch.classInfo;
      if (!schoolDetail) throw new HttpException(404, '학급정보를 찾을 수 없습니다.');

      return schoolDetail[1].row;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else if (error instanceof AxiosError) {
        throw new HttpException(500, '오류가 발생했습니다.');
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  }

  public async requestSchoolVerify(user: User, verifyData: SchoolVerifyDto): Promise<UserSchoolVerify> {
    try {
      const findImage = await this.image.findUnique({
        where: {
          id: verifyData.imageId,
        },
      });
      if (!findImage) throw new HttpException(404, '인증용 이미지를 업로드 해 주세요.');

      const findUser = await this.user.findUnique({
        where: {
          id: user.id,
        },
      });

      const findSchool = await this.getSchoolInfoById(verifyData.schoolId);
      if (!findSchool) throw new HttpException(404, '학교를 찾을 수 없습니다.');

      const createVerifyImage = await this.userSchoolVerify.create({
        data: {
          userId: user.id,
          userName: findUser.name,
          imageId: findImage.id,
          process: Process.pending,
          schoolId: verifyData.schoolId,
          schoolName: findSchool.name ? findSchool.name : findSchool.defaultName,
          grade: verifyData.grade,
          class: verifyData.class,
          dept: verifyData.dept,
        },
      });

      return createVerifyImage;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else if (error instanceof AxiosError) {
        throw new HttpException(500, '오류가 발생했습니다.');
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  }

  private semesterHandler(): number {
    const today = dayjs();

    const semester1Start = dayjs('03-01');
    const semester2Start = dayjs('08-01');
    const semester2End = dayjs('12-31');

    if (today.isAfter(semester1Start) && today.isBefore(semester2Start)) {
      return 1;
    } else if (today.isAfter(semester2Start) && today.isBefore(semester2End)) {
      return 2;
    }
  }
}

export default SchoolService;
