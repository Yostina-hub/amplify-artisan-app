import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CampaignsService } from './campaigns.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Campaigns')
@Controller('campaigns')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class CampaignsController {
  constructor(private campaignsService: CampaignsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all campaigns' })
  async findAll(@CurrentUser() user: any, @Query() filters: any) {
    return this.campaignsService.findAll(user.companyId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaigns by ID' })
  async findOne(@Param('id') id: string) {
    return this.campaignsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create campaigns' })
  async create(@CurrentUser() user: any, @Body() createData: any) {
    return this.campaignsService.create({ ...createData, company_id: user.companyId });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update campaigns' })
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.campaignsService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete campaigns' })
  async delete(@Param('id') id: string) {
    return this.campaignsService.delete(id);
  }
}
