import { IsDateString, IsOptional, IsString, ValidateIf } from 'class-validator';

export class SearchSchoolDto {
  @IsString({ message: '검색할 학교 이름을 입력해주세요.' })
  public keyword: string;
}

export class GetMealDto {
  @IsOptional()
  @ValidateIf(o => o.endDate)
  @IsDateString({ strict: true }, { message: '날짜 형식이 아닙니다.' })
  public startDate: string;

  @IsOptional()
  @ValidateIf(o => o.startDate)
  @IsDateString({ strict: true }, { message: '날짜 형식이 아닙니다.' })
  public endDate: string;

  @IsOptional()
  @ValidateIf(o => !o.startDate && !o.endDate)
  @IsDateString({ strict: true }, { message: '날짜 형식이 아닙니다.' })
  public date: string;
}
