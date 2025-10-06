import { Module } from '@nestjs/common';
import { CallReportsController } from './call-reports.controller';
import { CallReportsService } from './call-reports.service';

@Module({
  controllers: [CallReportsController],
  providers: [CallReportsService],
  exports: [CallReportsService],
})
export class CallReportsModule {}
