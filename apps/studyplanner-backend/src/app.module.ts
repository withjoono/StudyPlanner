import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PlannerModule } from './planner/planner.module';
import { TimerModule } from './timer/timer.module';
import { VerificationModule } from './verification/verification.module';
import { ScoringModule } from './scoring/scoring.module';
import { QuizModule } from './quiz/quiz.module';
import { ReportModule } from './report/report.module';
import { ExamModule } from './exam/exam.module';
import { SyncModule } from './sync/sync.module';
import { PrismaModule } from './prisma';
import { MessageModule } from './message/message.module';
import { ParentModule } from './parent/parent.module';
import { TeacherModule } from './teacher/teacher.module';
import { StudentModule } from './student/student.module';

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
    QuizModule,
    ReportModule,
    ExamModule,
    SyncModule,

    // Multi-role Modules
    MessageModule,
    ParentModule,
    TeacherModule,
    StudentModule,
  ],
})
export class AppModule {}
