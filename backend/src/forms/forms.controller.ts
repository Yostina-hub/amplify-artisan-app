import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FormsService } from './forms.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Forms')
@Controller('forms')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class FormsController {
  constructor(private formsService: FormsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all forms' })
  async findAll(@CurrentUser() user: any, @Query() filters: any) {
    return this.formsService.findAll(user.companyId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get forms by ID' })
  async findOne(@Param('id') id: string) {
    return this.formsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create forms' })
  async create(@CurrentUser() user: any, @Body() createData: any) {
    return this.formsService.create({ ...createData, company_id: user.companyId });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update forms' })
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.formsService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete forms' })
  async delete(@Param('id') id: string) {
    return this.formsService.delete(id);
  }
}
