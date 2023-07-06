import { HttpException } from '@/exceptions/HttpException';
import { IMealInfoResponse, IMealInfoRow, ISchoolInfoResponse, ISchoolInfoRow, ITimeTableResponse } from '@/interfaces/neisapi.interface';
import { neisClient } from '@/utils/client';
import { AxiosError } from 'axios';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);

class SchoolService {
  public async searchSchool(keyword: string): Promise<ISchoolInfoRow[]> {
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

  public async getSchoolById(schoolId: number): Promise<ISchoolInfoRow> {
    try {
      const { data: resp } = await neisClient.get('/hub/schoolInfo', {
        params: {
          SD_SCHUL_CODE: schoolId,
        },
      });

      const schoolInfo: ISchoolInfoResponse = resp.schoolInfo;

      if (!schoolInfo) {
        throw new HttpException(404, '해당하는 학교가 없습니다.');
      }

      return schoolInfo[1].row[0];
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

  public async getMeal(schoolId: number, data: IMealQuery): Promise<Array<IMealInfoRow>> {
    try {
      const schoolInfo = await this.getSchoolById(schoolId);
      if (!schoolInfo) throw new HttpException(404, '해당하는 학교가 없습니다.');

      const atpt = schoolInfo.ATPT_OFCDC_SC_CODE;
      const { data: resp } = await neisClient.get('/hub/mealServiceDietInfo', {
        params: {
          ATPT_OFCDC_SC_CODE: atpt,
          SD_SCHUL_CODE: schoolId,
          MLSV_YMD: data.date ? dayjs(data.date).format('YYYYMMDD') : null,
          MLSV_FROM_YMD: data.startDate ? dayjs(data.startDate).format('YYYYMMDD') : null,
          MLSV_TO_YMD: data.endDate ? dayjs(data.endDate).format('YYYYMMDD') : null,
        },
      });

      const mealInfo: IMealInfoResponse = resp.mealServiceDietInfo;
      if (!mealInfo) {
        throw new HttpException(404, '해당하는 급식이 없습니다.');
      }
      return mealInfo[1].row;
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

  public async getTimetable(schoolId: number, data: ITimetableQuery): Promise<any> {
    try {
      const schoolInfo = await this.getSchoolById(schoolId);
      if (!schoolInfo) throw new HttpException(404, '해당하는 학교가 없습니다.');

      const url = schoolInfo.SCHUL_KND_SC_NM === '고등학교' ? '/hub/hisTimetable' : '/hub/misTimetable';
      const { data: resp } = await neisClient.get(url, {
        params: {
          ATPT_OFCDC_SC_CODE: schoolInfo.ATPT_OFCDC_SC_CODE,
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

      const timetableInfo: ITimeTableResponse = schoolInfo.SCHUL_KND_SC_NM === '고등학교' ? resp.hisTimetable : resp.misTimetable;
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

  private semesterHandler(): number {
    const today = dayjs();
    const year = today.year();

    const semester1Start = dayjs(`${year}-02-01`);
    const semester1End = dayjs(`${year}-07-15`);
    let semester2End;

    if (today.isAfter(semester1End) && today.isBefore(dayjs(`${year + 1}-04-01`))) {
      semester2End = dayjs(`${year + 1}-03-31`);
    } else {
      semester2End = dayjs(`${year}-03-31`);
    }

    if (today.isBetween(semester1Start, semester1End, null, '[]')) {
      return 1;
    } else if (today.isBetween(semester1End, semester2End, null, '[]')) {
      return 2;
    } else {
      return null;
    }
  }
}

export default SchoolService;
