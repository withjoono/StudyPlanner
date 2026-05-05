import { IsOptional, IsIn, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class LeaderboardQueryDto {
  @ApiPropertyOptional({ enum: ['daily', 'weekly', 'monthly'], default: 'weekly' })
  @IsOptional()
  @IsIn(['daily', 'weekly', 'monthly'])
  period?: 'daily' | 'weekly' | 'monthly' = 'weekly';

  @ApiPropertyOptional({ description: '기준 날짜 (YYYY-MM-DD). 기본값: 오늘' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({ description: '조회할 그룹 ID (없으면 기본 그룹)' })
  @IsOptional()
  @IsString()
  groupId?: string;
}
