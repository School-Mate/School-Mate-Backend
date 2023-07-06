import { HttpException } from '@/exceptions/HttpException';
import { BusStationInfo } from '@/interfaces/busapi.interface';
import { busClient, kakaoClient } from '@/utils/client';
import { AxiosError } from 'axios';
import SchoolService from './school.service';

class BusService {
  schoolService = new SchoolService();
  public async searchBusStation(long: string, lati: string): Promise<BusStationInfo[]> {
    try {
      const { data: busStationfetch } = await busClient.get('/1613000/BusSttnInfoInqireService/getCrdntPrxmtSttnList', {
        params: {
          gpsLati: lati,
          gpsLong: long,
        },
      });

      const busStationList: BusStationInfo[] = busStationfetch.response.body.items.item;

      if (!busStationList) {
        throw new HttpException(404, '해당하는 정류장이 없습니다.');
      }

      return busStationList;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else if (error instanceof AxiosError) {
        throw new HttpException(500, '버스 API 서버에 오류가 발생했습니다.');
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  }

  // TODO: interface
  public async searchStationBySchoolId(schoolId: string): Promise<Array<BusStationInfo>> {
    try {
      const schoolInfo = await this.schoolService.getSchoolById(schoolId as any as number);
      if (!schoolInfo) throw new HttpException(404, '해당하는 학교가 없습니다.');

      const org = schoolInfo.ORG_RDNMA;
      const { data: addressfetch } = await kakaoClient.get('/v2/local/search/address.json', {
        params: {
          query: org,
          analyze_type: 'similar',
        },
      });

      const addressList: IAddressDocuments[] = addressfetch.documents;

      const x = addressList[0].x;
      const y = addressList[0].y;

      return await this.searchBusStation(x, y);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else if (error instanceof AxiosError) {
        throw new HttpException(500, '버스 API 서버에 오류가 발생했습니다.');
      } else {
        throw new HttpException(500, '알 수 없는 오류가 발생했습니다.');
      }
    }
  }
}

export default BusService;