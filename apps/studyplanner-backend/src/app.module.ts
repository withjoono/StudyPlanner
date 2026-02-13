import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PlannerModule } from './planner/planner.module';
import { TimerModule } from './timer/timer.module';
import { ScoringModule } from './scoring/scoring.module';
import { VerificationModule } from './verification/verification.module';
import { QuizModule } from './quiz/quiz.module';
import { AnalysisModule } from './analysis/analysis.module';
import { ScheduleModule } from './schedule/schedule.module';
import { ExamModule } from './exam/exam.module';
import { NotificationModule } from './notification/notification.module';
import { SyncModule } from './sync/sync.module';
import { PrismaModule } from './prisma';
import { MessageModule } from './message/message.module';
import { ParentModule } from './parent/parent.module';
import { TeacherModule } from './teacher/teacher.module';

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
    ScoringModule,
    VerificationModule,
    QuizModule,
    AnalysisModule,
    ScheduleModule,
    ExamModule,
    NotificationModule,
    SyncModule,

    // Multi-role Modules
    MessageModule,
    ParentModule,
    TeacherModule,
  ],
})
export class AppModule { }

