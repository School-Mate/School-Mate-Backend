import { VerifySchoolImageDto } from '@/dtos/school.dto';
import { HttpException } from '@/exceptions/HttpException';
import { IClassInfoResponse, IMealInfoResponse, ISchoolInfoResponse, ISchoolInfoRow, ITimeTableResponse } from '@/interfaces/neisapi.interface';
import { kakaoClient, neisClient } from '@/utils/client';
import { PrismaClient, School, User, Process, Meal } from '@prisma/client';
import { AxiosError } from 'axios';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);

class SchoolService {
  public image = new PrismaClient().image;
  public userSchoolVerify = new PrismaClient().userSchoolVerify;
  public school = new PrismaClient().school;
  public user = new PrismaClient().user;
  public meal = new PrismaClient().meal;

  public async searchSchool(keyword: string): Promise<ISchoolInfoRow[]> {
    // TODO: cashing
    try {
      const { data: middleSchoolfetch } = await neisClient.get('/hub/schoolInfo', {
        params: {
          SCHUL_NM: keyword,
          SCHUL_KND_SC_NM: '중학교',
        },
      });

      const { data: highSchoolfetch } = await neisClient.get('/hub/schoolInfo', {
        params: {
          SCHUL_NM: keyword,
          SCHUL_KND_SC_NM: '고등학교',
        },
      });

      const middleSchoolList: ISchoolInfoResponse = middleSchoolfetch.schoolInfo;
      const highSchoolList: ISchoolInfoResponse = highSchoolfetch.schoolInfo;

      if (!middleSchoolList && !highSchoolList) {
        throw new HttpException(404, '해당하는 학교가 없습니다.');
      }
      const schoolList: ISchoolInfoRow[] = [];

      if (middleSchoolList) {
        schoolList.push(...middleSchoolList[1].row);
      }

      if (highSchoolList) {
        schoolList.push(...highSchoolList[1].row);
      }

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

  public async getSchoolById(schoolId: string): Promise<School> {
    try {
      const findSchool = await this.school.findUnique({
        where: {
          schoolId: schoolId,
        },
      });
      if (findSchool) return findSchool;

      const { data: resp } = await neisClient.get('/hub/schoolInfo', {
        params: {
          SD_SCHUL_CODE: schoolId,
        },
      });
      const schoolInfo: ISchoolInfoResponse = resp.schoolInfo;

      const org = schoolInfo[1].row[0].ORG_RDNMA;
      const { data: addressfetch } = await kakaoClient.get('/v2/local/search/address.json', {
        params: {
          query: org,
          analyze_type: 'similar',
        },
      });
      const addressList: IAddressDocuments[] = addressfetch.documents;

      const createSchool = await this.school.create({
        data: {
          schoolId: schoolId,
          defaultName: schoolInfo[1].row[0].SCHUL_NM,
          code: schoolInfo[1].row[0].ATPT_OFCDC_SC_CODE,
          address: schoolInfo[1].row[0].ORG_RDNMA,
          x: Number(addressList[0].x) as any,
          y: Number(addressList[0].y) as any,
          kndsc: schoolInfo[1].row[0].SCHUL_KND_SC_NM,
        },
      });

      return createSchool;
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

  public async getMeal(schoolId: string, data: IMealQuery): Promise<Array<Meal>> {
    try {
      const schoolInfo = await this.getSchoolById(schoolId);
      if (!schoolInfo) throw new HttpException(404, '해당하는 학교가 없습니다.');

      const findMeal = await this.meal.findUnique({
        where: {
          id: `${schoolId}-${dayjs(data.date).format('YYYYMMDD')}-${data.mealType}`,
        },
      });
      if (findMeal) return [findMeal];

      const atpt = schoolInfo.code;
      const { data: resp } = await neisClient.get('/hub/mealServiceDietInfo', {
        params: {
          ATPT_OFCDC_SC_CODE: atpt,
          MMEAL_SC_CODE: data.mealType,
          SD_SCHUL_CODE: schoolId,
          MLSV_YMD: data.date ? dayjs(data.date).format('YYYYMMDD') : null,
          MLSV_FROM_YMD: data.startDate ? dayjs(data.startDate).format('YYYYMMDD') : null,
          MLSV_TO_YMD: data.endDate ? dayjs(data.endDate).format('YYYYMMDD') : null,
        },
      });

      const mealInfo: IMealInfoResponse = resp.mealServiceDietInfo;
      if (!mealInfo) throw new HttpException(404, '해당하는 급식이 없습니다.');

      const cashMeal = await this.meal.create({
        data: {
          id: `${schoolId}-${dayjs(data.date).format('YYYYMMDD')}-${data.mealType}`,
          MLSV_FGR: mealInfo[1].row[0].MLSV_FGR as any as number,
          DDISH_NM: mealInfo[1].row[0].DDISH_NM,
          ORPLC_INFO: mealInfo[1].row[0].ORPLC_INFO,
          CAL_INFO: mealInfo[1].row[0].CAL_INFO,
          NTR_INFO: mealInfo[1].row[0].NTR_INFO,
        },
      });
      return [cashMeal];
    } catch (error) {
      console.log(error);
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
    // TODO: cashing
    try {
      const schoolInfo = await this.getSchoolById(schoolId);
      if (!schoolInfo) throw new HttpException(404, '해당하는 학교가 없습니다.');

      const url = schoolInfo.kndsc === '고등학교' ? '/hub/hisTimetable' : '/hub/misTimetable';
      const { data: resp } = await neisClient.get(url, {
        params: {
          ATPT_OFCDC_SC_CODE: schoolInfo.code,
          SD_SCHUL_CODE: schoolId,
          GRADE: data.grade,
          CLASS_NM: data.class,
          SEM: data.semes ? data.semes : this.semesterHandler(),
          DDDEP_NM: data.dept,
          AY: data.year ? data.year : dayjs().format('YYYY'),
          ALL_TI_YMD: data.date ? dayjs(data.date).format('YYYYMMDD') : null,
          TI_FROM_YMD: data.startDate ? dayjs(data.startDate).format('YYYYMMDD') : null,
          TI_TO_YMD: data.endDate ? dayjs(data.endDate).format('YYYYMMDD') : null,
        },
      });

      const timetableInfo: ITimeTableResponse = schoolInfo.kndsc === '고등학교' ? resp.hisTimetable : resp.misTimetable;
      if (!timetableInfo) throw new HttpException(404, '해당하는 시간표가 없습니다.');
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

  public async verifySchoolImage(user: User, verifyData: VerifySchoolImageDto): Promise<any> {
    try {
      const findImage = await this.image.findFirst({
        where: {
          id: verifyData.imageId,
        },
      });

      if (!findImage) throw new HttpException(404, '인증용 이미지를 업로드 해주세요.');

      const findUser = await this.user.findUnique({
        where: {
          id: user.id,
        },
      });
      const findSchool = await this.getSchoolById(verifyData.schoolId);

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

  public async getSchoolDetail(schoolId: string): Promise<any> {
    try {
      const schoolInfo = await this.getSchoolById(schoolId);
      if (!schoolInfo) throw new HttpException(404, '해당하는 학교가 없습니다.');

      const { data: schoolDetailFetch } = await neisClient.get('/hub/classInfo', {
        params: {
          ATPT_OFCDC_SC_CODE: schoolInfo.code,
          SD_SCHUL_CODE: schoolId,
          AY: dayjs().format('YYYY'),
        },
      });

      const schoolDetail: IClassInfoResponse = schoolDetailFetch.classInfo;
      if (!schoolDetail) throw new HttpException(404, '해당하는 반 정보가 없습니다.');

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
