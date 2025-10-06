import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkflowsService } from './workflows.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Workflows')
@Controller('workflows')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class WorkflowsController {
  constructor(private workflowsService: WorkflowsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all workflows' })
  async findAll(@CurrentUser() user: any, @Query() filters: any) {
    return this.workflowsService.findAll(user.companyId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workflows by ID' })
  async findOne(@Param('id') id: string) {
    return this.workflowsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create workflows' })
  async create(@CurrentUser() user: any, @Body() createData: any) {
    return this.workflowsService.create({ ...createData, company_id: user.companyId });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update workflows' })
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.workflowsService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete workflows' })
  async delete(@Param('id') id: string) {
    return this.workflowsService.delete(id);
  }
}
