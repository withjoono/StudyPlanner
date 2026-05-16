import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { HubServiceClient } from './hub-service.client';

@Global()
@Module({
  imports: [HttpModule],
  providers: [HubServiceClient],
  exports: [HubServiceClient],
})
export class HubClientModule {}
