import { Process } from '@prisma/client';
import { IsIn, IsString } from 'class-validator';

export class AdminDto {
  @IsString({ message: '아이디를 입력해주세요.' })
  public id: string;

  @IsString({ message: '비밀번호를 입력해주세요.' })
  public password: string;
}

export class GetVerifyRequestDto {
  @IsString({ message: '처리 상태를 입력해주세요.' })
  public process: string;
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
  @IsString({ message: '처리 상태를 입력해주세요.' })
  public process: string;
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
  public process: string;

  @IsString({ message: '신고 타입을 입력해주세요.' })
  public targetType: string;
  
  @IsString({ message: '처리 상태를 입력해주세요.' })
  @IsIn(['pending', 'success', 'denied'], { message: 'pending, success, denied 중 하나를 입력해주세요.' })
  public process: Process;
}

export class CompleteReportDto {
  @IsString({ message: '신고ID를 입력해주세요.' })
  public reportId: string;
}
