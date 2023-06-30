import { HttpException } from '@/exceptions/HttpException';
import { ISchoolInfoResponse, ISchoolInfoRow } from '@/interfaces/neisapi.interface';
import { neisClient } from '@/utils/client';
import { AxiosError } from 'axios';

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
}

export default SchoolService;
