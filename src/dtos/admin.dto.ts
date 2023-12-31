import { Process } from '@prisma/client';
import { IsDate, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class AdminDto {
  @IsString({ message: '아이디를 입력해주세요.' })
  public id: string;

  @IsString({ message: '비밀번호를 입력해주세요.' })
  public password: string;
}

export class GetVerifyRequestDto {
  @IsOptional()
  @IsString({ message: '페이지를 입력해주세요.' })
  public page: string;
}

export class AdminRequestDto {
  @IsString({ message: '인증 요청 아이디를 입력해주세요.' })
  public requestId: string;

  @IsString({ message: '메세지를 입력해주세요.' })
  public message: string;

  @IsString({ message: '처리 상태를 입력해주세요.' })
  @IsIn(['pending', 'denied', 'success'], { message: 'pending, denied, success 중 하나를 입력해주세요.' })
  public process: Process;
}

export class GetBoardRequestDto {
  @IsOptional()
  @IsString({ message: '페이지를 입력해주세요.' })
  public page: string;
}

export class PostBoardRequestDto {
  @IsString({ message: '인증 요청 아이디를 입력해주세요.' })
  public requestId: string;

  @IsString({ message: '메세지를 입력해주세요.' })
  public message: string;

  @IsString({ message: '처리 상태를 입력해주세요.' })
  @IsIn(['pending', 'success', 'denied'], { message: 'pending, success, denied 중 하나를 입력해주세요.' })
  public process: Process;
}

export class GetReportRequestDto {
  @IsString({ message: '처리 상태를 입력해주세요.' })
  @IsIn(['pending', 'success', 'denied'], { message: 'pending, success, denied 중 하나를 입력해주세요.' })
  public process: Process;

  @IsOptional()
  @IsString({ message: '신고 타입을 입력해주세요.' })
  public targetType: string;

  @IsOptional()
  @IsString({ message: '페이지를 입력해주세요.' })
  public page: string;
}

export class CompleteReportDto {
  @IsString({ message: '제재 사유를 입력해주세요.' })
  public reason: string;

  @IsOptional()
  @IsNumber({}, { message: '차단 기간을 입력해주세요.' })
  public blockPeriod?: number;
}

export class GetAllDto {
  @IsOptional()
  public page: number;
  @IsOptional()
  public keyword: string;
}

export class SchoolNameDto {
  @IsString({ message: '학교 이름을 입력해주세요.' })
  public name: string;
}

export class UserBlockDto {
  @IsString({ message: '유저 아이디를 입력해주세요.' })
  public userId: string;

  @IsString({ message: '차단 사유 id를 입력해주세요.' })
  public targetId: string;

  @IsString({ message: '차단 사유를 입력해주세요.' })
  public reason: string;

  @IsDate({ message: '차단 만료일을 입력해주세요.' })
  public endDate: Date;
}
