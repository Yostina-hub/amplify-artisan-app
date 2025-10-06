import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { SocialProcessor } from './social.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'social-posts',
    }),
  ],
  controllers: [SocialController],
  providers: [SocialService, SocialProcessor],
  exports: [SocialService],
})
export class SocialModule {}
