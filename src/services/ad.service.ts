import { AdDto } from '@/dtos/ad.dto';
import { HttpException } from '@/exceptions/HttpException';
import Container, { Service } from 'typedi';
import { PrismaClientService } from './prisma.service';

@Service()
export class AdService {
  private prisma = Container.get(PrismaClientService);
  private advertise = Container.get(PrismaClientService).advertise;
  public async getAd() {
    try {
      const currentDate = new Date();
      const ad = await this.advertise.findMany({
        where: {
          startDate: {
            lte: currentDate,
          },
          endDate: {
            gte: currentDate,
          },
        },
      });

      if (!ad) throw new HttpException(404, '등록된 광고가 없습니다.');

      return ad;
    } catch (error) {
      throw new HttpException(500, error);
    }
  }

  public async createAd(data: AdDto) {
    try {
      const findAd = await this.advertise.findFirst({
        where: {
          title: data.title,
        },
      });
      if (findAd) throw new HttpException(409, '중복된 이름의 광고가 존재합니다.');
      if (new Date() > data.endDate) throw new HttpException(409, '종료 날짜가 현재 날짜보다 이전입니다.');

      const image = await this.prisma.image.findUnique({
        where: {
          id: data.image,
        },
      });

      if (!image) throw new HttpException(409, '존재하지 않는 이미지입니다.');

      const ad = await this.advertise.create({
        data: { ...data, image: image.key },
      });

      return ad;
    } catch (error) {
      throw new HttpException(500, error);
    }
  }

  public async updateAd(id: number, data: AdDto) {
    try {
      const findAd = await this.advertise.findUnique({
        where: {
          id: id,
        },
      });
      if (!findAd) throw new HttpException(409, '존재하지 않는 광고입니다.');

      const ad = await this.advertise.update({
        where: { id: id },
        data: { ...data },
      });

      return ad;
    } catch (error) {
      throw new HttpException(500, error);
    }
  }

  public async deleteAd(id: number) {
    try {
      const findAd = await this.advertise.findUnique({
        where: {
          id: id,
        },
      });
      if (!findAd) throw new HttpException(409, '존재하지 않는 광고입니다.');

      const ad = await this.advertise.delete({
        where: { id: id },
      });

      return ad;
    } catch (error) {
      throw new HttpException(500, error);
    }
  }

  public async increaseViews(id: number) {
    try {
      const findAd = await this.advertise.findUnique({
        where: {
          id: id,
        },
      });
      if (!findAd) throw new HttpException(409, '광고를 찾을 수 없습니다.');

      const ad = await this.advertise.update({
        where: { id: id },
        data: { views: findAd.views + 1 },
      });

      return ad;
    } catch (error) {
      throw new HttpException(500, error);
    }
  }
}
