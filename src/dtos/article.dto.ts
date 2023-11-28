import { IsOptional, IsString } from 'class-validator';

export class ArticleRequestQuery {
  @IsString({
    message: '페이지를 입력해주세요.',
  })
  @IsOptional()
  public page: number;
}

export class SearchCombineDto {
  @IsString({ message: '검색어를 입력해주세요.' })
  public keyword: string;
  @IsOptional()
  public page: number;
}
