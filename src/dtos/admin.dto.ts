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

export class PostVerifyRequestDto {
  @IsString({ message: '인증 요청 아이디를 입력해주세요.' })
  public requestId: string;

  @IsString({ message: '메세지를 입력해주세요.' })
  public message: string;

  @IsString({ message: '처리 상태를 입력해주세요.' })
  @IsIn(['pending', 'success', 'deny'], { message: 'pending, success, deny 중 하나를 입력해주세요.' })
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
  @IsIn(['pending', 'success', 'deny'], { message: 'pending, success, deny 중 하나를 입력해주세요.' })
  public process: Process;
}
// #TODO: 이후에도 요청 DTO 변경 없으면 하나로 병합
