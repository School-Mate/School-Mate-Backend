import { IsOptional, IsString } from 'class-validator';

export class FightSearchQuery {
  @IsString({
    message: '페이지를 입력해주세요.',
  })
  @IsOptional()
  public page: number;

  @IsOptional()
  @IsString({
    message: '검색어를 입력해주세요.',
  })
  public keyword: string;
}
