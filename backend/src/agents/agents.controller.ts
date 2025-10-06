import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Agents')
@Controller('agents')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AgentsController {
  constructor(private agentsService: AgentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all agents' })
  async findAll(@CurrentUser() user: any, @Query() filters: any) {
    return this.agentsService.findAll(user.companyId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get agents by ID' })
  async findOne(@Param('id') id: string) {
    return this.agentsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create agents' })
  async create(@CurrentUser() user: any, @Body() createData: any) {
    return this.agentsService.create({ ...createData, company_id: user.companyId });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update agents' })
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.agentsService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete agents' })
  async delete(@Param('id') id: string) {
    return this.agentsService.delete(id);
  }
}
