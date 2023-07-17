import { Provider } from '@/interfaces/auth.interface';
import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, Matches, ValidateIf } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: '이메일 형식이 아닙니다.' })
  @IsOptional()
  public email: string;

  @Matches(/^[0-9]{10,11}$/, { message: '전화번호 형식이 아닙니다.' })
  public phone: string;

  @ValidateIf(o => o.provider === 'id')
  @IsString({ message: '비밀번호 형식이 아닙니다.' })
  public password: string;

  @IsString({ message: '이름을 입력해주세요.' })
  public name: string;

  @IsIn(['kakao', 'google', 'id'])
  public provider: Provider;

  @IsString({ message: '인증 코드를 입력해주세요.' })
  public code: string;

  @IsString({ message: '인증 토큰를 입력해주세요.' })
  public token: string;

  @ValidateIf(o => o.provider === 'kakao' || o.provider === 'google')
  @IsString({ message: '소셜아이디를 입력해주세요.' })
  public socialId: string;

  @IsBoolean({ message: '마케팅 수신 동의 여부를 입력해주세요.' })
  public marketingAgree: boolean;
}

export class LoginUserDto {
  @Matches(/^[0-9]{10,11}$/, { message: '전화번호 형식이 아닙니다.' })
  public phone: string;

  @IsString({ message: '비밀번호를 입력해주세요.' })
  public password: string;
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

export class UpdateProfileDto {
  @IsOptional()
  @IsString({
    message: '이미지 아이디를 입력해주세요',
  })
  public imageId: string;
}

export class UpdatePasswordDto {
  @IsString({ message: '기존 비밀번호를 입력해주세요.' })
  public password: string;

  @IsString({ message: '새로운 비밀번호를 입력해주세요.' })
  public newPassword: string;
}

export class UpdateNicknameDto {
  @IsString({ message: '닉네임을 입력해주세요.' })
  public nickname: string;
}
