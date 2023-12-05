import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class AskedDto {
  @IsString({ message: '질문을 입력해주세요.' })
  public question: string;

  @IsBoolean({ message: '익명여부를 선택해주세요.' })
  public isAnonymous: boolean;
}

export class AskedTagDto {
  @IsString({ message: '태그를 입력해주세요.' })
  public tag: string;
}

export class AskedCreateDto {
  @IsOptional()
  @IsString({ message: '사진을 선택해주세요.' })
  public image: string;

  @IsString({ message: '첫번째 태그를 입력해주세요.' })
  public tag1: string;

  @IsString({ message: '두번째 태그를 입력해주세요.' })
  public tag2: string;

  @IsString({ message: '아이디를 입력해주세요.' })
  public id: string;
}

export class AskedUpdateDto {
  @IsOptional()
  @IsString({ message: '첫번째 태그를 입력해주세요.' })
  public tag1: string;

  @IsOptional()
  @IsString({ message: '두번째 태그를 입력해주세요.' })
  public tag2: string;

  @IsOptional()
  @IsString({ message: '아이디를 입력해주세요.' })
  public id: string;
}

export class AskedReceiveDto {
  @IsString({ message: '답변을 입력해주세요.' })
  public answer: string;
}

export class AskedStatusMessageDto {
  @IsString({ message: '상태메세지를 입력해주세요.' })
  public message: string;
}
export class AskedRequestQuery {
  @IsString({
    message: '페이지를 입력해주세요.',
  })
  @IsOptional()
  public page: number;
}
