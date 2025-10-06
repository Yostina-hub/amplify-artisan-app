import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InfluencersService } from './influencers.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Influencers')
@Controller('influencers')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class InfluencersController {
  constructor(private influencersService: InfluencersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all influencers' })
  async findAll(@CurrentUser() user: any, @Query() filters: any) {
    return this.influencersService.findAll(user.companyId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get influencers by ID' })
  async findOne(@Param('id') id: string) {
    return this.influencersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create influencers' })
  async create(@CurrentUser() user: any, @Body() createData: any) {
    return this.influencersService.create({ ...createData, company_id: user.companyId });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update influencers' })
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.influencersService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete influencers' })
  async delete(@Param('id') id: string) {
    return this.influencersService.delete(id);
  }
}
