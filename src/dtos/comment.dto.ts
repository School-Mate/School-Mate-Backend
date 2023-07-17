import { IsOptional, IsString } from 'class-validator';

export class CommentRequestQuery {
  @IsString({
    message: '페이지를 입력해주세요.',
  })
  @IsOptional()
  public page: number;
}
