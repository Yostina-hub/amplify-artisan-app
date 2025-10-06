import { Module } from '@nestjs/common';
import { SocialMessagesController } from './social-messages.controller';
import { SocialMessagesService } from './social-messages.service';

@Module({
  controllers: [SocialMessagesController],
  providers: [SocialMessagesService],
  exports: [SocialMessagesService],
})
export class SocialMessagesModule {}
