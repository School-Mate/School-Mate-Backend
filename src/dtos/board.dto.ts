import { IsArray, IsBoolean, IsString } from 'class-validator';

export class BoardDto {
  @IsString({ message: '본문을 입력해주세요.' })
  public content: string;

  @IsString({ message: '제목을 입력해주세요.' })
  public title: string;

  @IsArray({ message: '이미지를 입력해주세요.' })
  public images: string[];

  @IsBoolean({ message: '익명여부를 선택해주세요.' })
  public isAnonymous: boolean;
}

export class CommentDto {
  @IsString({ message: '본문을 입력해주세요.' })
  public content: string;

  @IsBoolean({ message: '익명여부를 선택해주세요.' })
  public isAnonymous: boolean;
}

export class SendBoardRequestDto {
  @IsString({ message: '게시판 이름을 입력해주세요.' })
  public name: string;

  @IsString({ message: '게시판 설명을 입력해주세요.' })
  public description: string;
}

export class UserPageQuery {
  @IsString({ message: '페이지를 입력해주세요.' })
  public page: string;
}