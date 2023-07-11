import { IsString } from 'class-validator';

export class AdminDto {
  @IsString({ message: '아이디를 입력해주세요.' })
  public id: string;

  @IsString({ message: '비밀번호를 입력해주세요.' })
  public password: string;
}

export class VerifyRequestDto {
  @IsString({ message: '유저 아이디를 입력해주세요.' })
  public userId: string;

  @IsString({ message: '메세지를 입력해주세요.' })
  public message: string;

  @IsString({ message: '처리 상태를 입력해주세요.' })
  public process: string;
}
