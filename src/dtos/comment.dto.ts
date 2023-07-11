import { IsBoolean, IsString } from 'class-validator';

export class CommentDto {
  @IsString({ message: '본문을 입력해주세요.' })
  public content: string;

  @IsBoolean({ message: '익명여부를 선택해주세요.' })
  public isAnonymous: boolean;
}
