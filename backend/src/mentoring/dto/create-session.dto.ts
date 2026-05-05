import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  weekStart: string; // YYYY-MM-DD

  @IsString()
  weekEnd: string;

  @IsOptional()
  @IsObject()
  checklist?: {
    planAdherence: boolean;
    missionRate: boolean;
    routinePractice: boolean;
    photoUpload: boolean;
    reflection: boolean;
  };

  @IsOptional()
  @IsString()
  grade?: string; // A, B, C, D, F

  @IsOptional()
  @IsObject()
  subjectComments?: Record<string, string>;

  @IsOptional()
  @IsString()
  overallComment?: string;

  @IsOptional()
  @IsString()
  nextWeekTask?: string;
}

export class AckSessionDto {
  @IsBoolean()
  acked: boolean;
}
