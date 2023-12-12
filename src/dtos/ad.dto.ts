import { IsDate, IsDateString, IsOptional, IsString } from 'class-validator';

export class AdDto {
  @IsString({ message: '광고 제목을 입력해주세요.' })
  public title: string;

  @IsString({ message: '광고 이미지를 추가해주세요.' })
  public image: string;

  @IsString({ message: '광고 링크를 추가해주세요.' })
  public link: string;

  @IsDateString({ message: '광고 시작 날짜를 추가해주세요.' })
  @IsOptional()
  public startDate: Date;

  @IsDateString({ message: '광고 종료 날짜를 추가해주세요.' })
  public endDate: Date;
}
