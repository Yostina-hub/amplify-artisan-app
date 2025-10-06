import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Projects')
@Controller('projects')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all projects' })
  async findAll(@CurrentUser() user: any, @Query() filters: any) {
    return this.projectsService.findAll(user.companyId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get projects by ID' })
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create projects' })
  async create(@CurrentUser() user: any, @Body() createData: any) {
    return this.projectsService.create({ ...createData, company_id: user.companyId });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update projects' })
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.projectsService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete projects' })
  async delete(@Param('id') id: string) {
    return this.projectsService.delete(id);
  }
}
