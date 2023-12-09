import { ReportTargetType } from '@prisma/client';
import { IsIn, IsString, ValidateIf } from 'class-validator';

export class ReportDto {
  @IsString({ message: '신고 대상을 입력해주세요.' })
  targetId: string;

  @IsIn(['user', 'article', 'asked', 'comment', 'recomment'], { message: '잘못된 신고 대상입니다.' })
  targetType: ReportTargetType;

  @IsString({ message: '신고 내용을 입력해주세요.' })
  message: string;

  @ValidateIf(o => o.targetType === 'article')
  @IsString({ message: '게시판 아이디를 입력해주세요' })
  boardId: string;
}
