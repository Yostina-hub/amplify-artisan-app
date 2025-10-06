import { Module } from '@nestjs/common';
import { BrandMentionsController } from './brand-mentions.controller';
import { BrandMentionsService } from './brand-mentions.service';

@Module({
  controllers: [BrandMentionsController],
  providers: [BrandMentionsService],
  exports: [BrandMentionsService],
})
export class BrandMentionsModule {}
