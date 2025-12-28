import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PlannerModule } from './planner/planner.module';
import { PrismaModule } from './prisma';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database (Prisma)
    PrismaModule,

    // Feature Modules
    PlannerModule,
  ],
})
export class AppModule {}
