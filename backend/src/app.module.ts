import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PlannerModule } from './planner/planner.module';
import { TimerModule } from './timer/timer.module';
import { VerificationModule } from './verification/verification.module';
import { ScoringModule } from './scoring/scoring.module';
import { ReportModule } from './report/report.module';
import { SyncModule } from './sync/sync.module';
import { PrismaModule } from './prisma';
import { MessageModule } from './message/message.module';
import { ParentModule } from './parent/parent.module';
import { TeacherModule } from './teacher/teacher.module';
import { StudentModule } from './student/student.module';
import { SharedScheduleModule } from './shared-schedule/shared-schedule.module';
import { MaterialModule } from './material/material.module';
import { GrowthModule } from './growth/growth.module';
import { RankingModule } from './ranking/ranking.module';
import { AcornModule } from './acorn/acorn.module';
import { MyClassModule } from './myclass/myclass.module';
import { BadgeModule } from './badge/badge.module';
import { MentoringModule } from './mentoring/mentoring.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Authentication
    AuthModule,

    // Database (Prisma)
    PrismaModule,

    // Feature Modules
    PlannerModule,
    TimerModule,
    VerificationModule,
    ScoringModule,
    ReportModule,
    SyncModule,

    // Multi-role Modules
    MessageModule,
    ParentModule,
    TeacherModule,
    StudentModule,

    // Shared (Hub)
    SharedScheduleModule,

    // Material DB (교재/인강 검색)
    MaterialModule,

    // Growth (성장형 플래너)
    GrowthModule,

    // Ranking (학습 랭킹 리더보드)
    RankingModule,

    // 도토리 (Acorn) 보상 시스템
    AcornModule,

    // 마이 클래스 (사용자 생성 경쟁 반)
    MyClassModule,

    // 뱃지 & 칭호
    BadgeModule,

    // 멘토링 (선생님 주간 검사 + 학생 피드백 수신함)
    MentoringModule,
  ],
})
export class AppModule {}
