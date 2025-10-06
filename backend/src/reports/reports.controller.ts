import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all reports' })
  async findAll(@CurrentUser() user: any, @Query() filters: any) {
    return this.reportsService.findAll(user.companyId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get reports by ID' })
  async findOne(@Param('id') id: string) {
    return this.reportsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create reports' })
  async create(@CurrentUser() user: any, @Body() createData: any) {
    return this.reportsService.create({ ...createData, company_id: user.companyId });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update reports' })
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.reportsService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete reports' })
  async delete(@Param('id') id: string) {
    return this.reportsService.delete(id);
  }
}
