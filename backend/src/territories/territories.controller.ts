import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TerritoriesService } from './territories.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Territories')
@Controller('territories')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class TerritoriesController {
  constructor(private territoriesService: TerritoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all territories' })
  async findAll(@CurrentUser() user: any, @Query() filters: any) {
    return this.territoriesService.findAll(user.companyId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get territories by ID' })
  async findOne(@Param('id') id: string) {
    return this.territoriesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create territories' })
  async create(@CurrentUser() user: any, @Body() createData: any) {
    return this.territoriesService.create({ ...createData, company_id: user.companyId });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update territories' })
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.territoriesService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete territories' })
  async delete(@Param('id') id: string) {
    return this.territoriesService.delete(id);
  }
}
