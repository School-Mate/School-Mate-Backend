import { IsOptional, IsString, Matches } from 'class-validator';

export class ArticleRequestQuery {
  @IsString({
    message: '페이지를 입력해주세요.',
  })
  @IsOptional()
  public page: number;
}

export class SearchCombineDto {
  @Matches(/^[가-힣a-zA-Z0-9]{1,}$/, { message: '검색어 형식이 아닙니다.' })
  public keyword: string;
}
