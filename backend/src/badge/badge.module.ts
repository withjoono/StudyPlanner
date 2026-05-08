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
    try {
      await this.badgeService.seedBadgeCatalog();
    } catch (e) {
      console.warn('Badge catalog seed skipped (DB may not be ready):', e.message);
    }
  }
}
