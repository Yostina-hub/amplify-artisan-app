import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BrandMentionsService } from './brand-mentions.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('BrandMentions')
@Controller('brand-mentions')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class BrandMentionsController {
  constructor(private brandmentionsService: BrandMentionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all brand-mentions' })
  async findAll(@CurrentUser() user: any, @Query() filters: any) {
    return this.brandmentionsService.findAll(user.companyId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get brand-mentions by ID' })
  async findOne(@Param('id') id: string) {
    return this.brandmentionsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create brand-mentions' })
  async create(@CurrentUser() user: any, @Body() createData: any) {
    return this.brandmentionsService.create({ ...createData, company_id: user.companyId });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update brand-mentions' })
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.brandmentionsService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete brand-mentions' })
  async delete(@Param('id') id: string) {
    return this.brandmentionsService.delete(id);
  }
}
