import { IsString } from 'class-validator';

export class SearchSchoolDto {
  @IsString({ message: '검색할 학교 이름을 입력해주세요.' })
  public keyword: string;
}
