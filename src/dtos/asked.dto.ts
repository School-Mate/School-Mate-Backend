import { IsBoolean, IsString } from 'class-validator';

export class AskedDto {
  @IsString({ message: '질문을 입력해주세요.' })
  public question: string;

  @IsBoolean({ message: '익명여부를 선택해주세요.' })
  public isAnonymous: boolean;
}

export class AskedReceiveDto {
  @IsString({ message: '답변을 입력해주세요.' })
  public answer: string;
}
