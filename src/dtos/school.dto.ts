import { IsDateString, IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator';

export class SearchSchoolDto {
  @IsString({ message: '검색할 학교 이름을 입력해주세요.' })
  public keyword: string;
}

export class GetMealDto {
  @ValidateIf(o => o.endDate)
  @IsDateString({ strict: true }, { message: '날짜 형식이 아닙니다.' })
  public startDate: string;

  @ValidateIf(o => o.startDate)
  @IsDateString({ strict: true }, { message: '날짜 형식이 아닙니다.' })
  public endDate: string;

  @ValidateIf(o => !o.startDate && !o.endDate)
  @IsDateString({ strict: true }, { message: '날짜 형식이 아닙니다.' })
  public date: string;
}

export class GetTimetableDto {
  @IsNumber()
  public grade: number;

  @IsNumber()
  public class: number;

  @IsOptional()
  @IsNumber()
  public semes: number;

  @IsOptional()
  @IsString()
  public dept: string;

  @IsOptional()
  @IsNumber()
  public year: number;

  @ValidateIf(o => o.endDate)
  @IsDateString({ strict: true }, { message: '날짜 형식이 아닙니다.' })
  public startDate: string;

  @ValidateIf(o => o.startDate)
  @IsDateString({ strict: true }, { message: '날짜 형식이 아닙니다.' })
  public endDate: string;
}

export class VerifySchoolImageDto {
  @IsString({ message: '' })
  public imageId: string;
}
