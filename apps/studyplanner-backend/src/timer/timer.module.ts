import { Module, forwardRef } from '@nestjs/common';
import { TimerController } from './timer.controller';
import { TimerService } from './timer.service';
import { ScoringModule } from '../scoring/scoring.module';

@Module({
  imports: [forwardRef(() => ScoringModule)],
  controllers: [TimerController],
  providers: [TimerService],
  exports: [TimerService],
})
export class TimerModule {}
