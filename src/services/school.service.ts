import { HttpException } from '@/exceptions/HttpException';
import { IMealInfoResponse, IMealInfoRow, ISchoolInfoResponse, ISchoolInfoRow } from '@/interfaces/neisapi.interface';
import { neisClient } from '@/utils/client';
import { AxiosError } from 'axios';
import dayjs from 'dayjs';

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

  public async getMeal(schoolId: number, data: any): Promise<Array<IMealInfoRow>> {
    try {
      const atpt = (await this.getSchoolById(schoolId)).ATPT_OFCDC_SC_CODE;

      const { data: resp, request: req } = await neisClient.get('/hub/mealServiceDietInfo', {
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
}

export default SchoolService;
