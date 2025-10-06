import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CallReportsService } from './call-reports.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('CallReports')
@Controller('call-reports')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class CallReportsController {
  constructor(private callreportsService: CallReportsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all call-reports' })
  async findAll(@CurrentUser() user: any, @Query() filters: any) {
    return this.callreportsService.findAll(user.companyId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get call-reports by ID' })
  async findOne(@Param('id') id: string) {
    return this.callreportsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create call-reports' })
  async create(@CurrentUser() user: any, @Body() createData: any) {
    return this.callreportsService.create({ ...createData, company_id: user.companyId });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update call-reports' })
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.callreportsService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete call-reports' })
  async delete(@Param('id') id: string) {
    return this.callreportsService.delete(id);
  }
}
