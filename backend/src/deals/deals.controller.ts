import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DealsService } from './deals.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Deals')
@Controller('deals')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class DealsController {
  constructor(private dealsService: DealsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all deals' })
  async findAll(@CurrentUser() user: any, @Query() filters: any) {
    return this.dealsService.findAll(user.companyId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get deals by ID' })
  async findOne(@Param('id') id: string) {
    return this.dealsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create deals' })
  async create(@CurrentUser() user: any, @Body() createData: any) {
    return this.dealsService.create({ ...createData, company_id: user.companyId });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update deals' })
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.dealsService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete deals' })
  async delete(@Param('id') id: string) {
    return this.dealsService.delete(id);
  }
}
