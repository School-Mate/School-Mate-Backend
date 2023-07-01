import { Provider } from '@/interfaces/auth.interface';
import { IsEmail, IsIn, IsOptional, IsString, Matches, ValidateIf } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: '이메일 형식이 아닙니다.' })
  @IsOptional()
  public email: string;

  @ValidateIf(o => o.provider === 'id')
  @Matches(/^[0-9]{10,11}$/, { message: '전화번호 형식이 아닙니다.' })
  public phone: string;

  @ValidateIf(o => o.provider === 'id')
  @IsString({ message: '비밀번호 형식이 아닙니다.' })
  public password: string;

  @IsString({ message: '이름을 입력해주세요.' })
  public name: string;

  @IsIn(['kakao', 'goggle', 'id'])
  public provider: Provider;

  @IsString({ message: '인증 코드를 입력해주세요.' })
  public code: string;

  @IsString({ message: '인증 토큰를 입력해주세요.' })
  public token: string;

  @ValidateIf(o => o.provider === 'kakao' || o.provider === 'google')
  @IsString({ message: '소셜아이디를 입력해주세요.' })
  public socialId: string;
}

export class VerifyPhoneMessageDto {
  @Matches(/^[0-9]{10,11}$/, { message: '전화번호 형식이 아닙니다.' })
  public phone: string;
}

export class VerifyPhoneCodeDto {
  @Matches(/^[0-9]{10,11}$/, { message: '전화번호 형식이 아닙니다.' })
  public phone: string;

  @IsString({ message: '인증 코드를 입력해주세요.' })
  public code: string;

  @IsString({ message: '인증 토큰를 입력해주세요.' })
  public token: string;
}
