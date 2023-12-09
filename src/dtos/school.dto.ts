import { IsDateString, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class SearchSchoolDto {
  @IsString({ message: '검색할 학교 이름을 입력해주세요.' })
  public keyword: string;
}

export class GetMealDto {
  @IsDateString({ strict: true }, { message: '날짜 형식이 아닙니다.' })
  public date: string;

  @IsIn(['1', '2', '3'], { message: '급식 종류를 입력해주세요.' })
  public mealType: '1' | '2' | '3';
}

export class GetTimetableDto {
  @IsString({ message: '학년을 입력해주세요.' })
  public grade: number;

  @IsString({ message: '반을 입력해주세요.' })
  public class: number;

  @IsOptional()
  @IsString()
  public semes: number;

  @IsOptional()
  @IsString()
  public dept: string;

  @IsOptional()
  @IsNumber()
  public year: number;

  @IsDateString({ strict: true }, { message: '날짜 형식이 아닙니다.' })
  public date: string;
}

export class SchoolVerifyDto {
  @IsString({ message: '이미지 아이디를 입력해주세요,' })
  public imageId: string;

  @IsString({ message: '학교를 선택해주세요.' })
  public schoolId: string;

  @IsString({ message: '학년을 입력해주세요.' })
  public grade: string;

  @IsString({ message: '반을 입력해주세요.' })
  public class: string;

  @IsOptional()
  @IsString({ message: '학과(계열)을 입력해주세요.' })
  public dept: string;
}
