import { IsString } from 'class-validator';

export class AdminDto {
  @IsString({ message: '아이디를 입력해주세요.' })
  public id: string;

  @IsString({ message: '비밀번호를 입력해주세요.' })
  public password: string;
}
