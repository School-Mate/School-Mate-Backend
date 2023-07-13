import { IsArray, IsBoolean, IsString } from 'class-validator';

export class BoardDto {
  @IsString({ message: '본문을 입력해주세요.' })
  public content: string;

  @IsString({ message: '제목을 입력해주세요.' })
  public title: string;

  @IsArray({ message: '이미지를 입력해주세요.' })
  public images: string[];

  @IsString({ message: '유저 아이디를 입력해주세요.' })
  public userId: string;

  @IsBoolean({ message: '익명여부를 선택해주세요.' })
  public isAnonymous: boolean;
}

export class CommentDto {
  @IsString({ message: '본문을 입력해주세요.' })
  public content: string;

  @IsBoolean({ message: '익명여부를 선택해주세요.' })
  public isAnonymous: boolean;
}
