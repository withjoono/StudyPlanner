import { Module, OnModuleInit } from '@nestjs/common';
import { BadgeService } from './badge.service';
import { BadgeController } from './badge.controller';
import { PrismaModule } from '../prisma';

@Module({
  imports: [PrismaModule],
  providers: [BadgeService],
  controllers: [BadgeController],
  exports: [BadgeService],
})
export class BadgeModule implements OnModuleInit {
  constructor(private readonly badgeService: BadgeService) {}

  async onModuleInit() {
    // 서버 시작 시 뱃지 카탈로그 자동 시드
    await this.badgeService.seedBadgeCatalog();
  }
}
