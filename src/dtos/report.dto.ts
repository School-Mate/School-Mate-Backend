import { targetType } from '@/interfaces/report.interface';
import { IsIn, IsString } from 'class-validator';

export class ReportDto {
  @IsString({ message: '신고 대상을 입력해주세요.' })
  targetId: string;

  @IsIn(['user', 'article', 'asked', 'comment', 'recomment'], { message: '잘못된 신고 대상입니다.' })
  targetType: targetType;

  @IsString({ message: '신고 내용을 입력해주세요.' })
  message: string;
}
