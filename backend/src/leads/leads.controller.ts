import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Leads')
@Controller('leads')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all leads' })
  async findAll(@CurrentUser() user: any, @Query() filters: any) {
    return this.leadsService.findAll(user.companyId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead by ID' })
  async findOne(@Param('id') id: string) {
    return this.leadsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create lead' })
  async create(@CurrentUser() user: any, @Body() createData: any) {
    return this.leadsService.create({
      ...createData,
      company_id: user.companyId,
      created_by: user.id,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update lead' })
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.leadsService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete lead' })
  async delete(@Param('id') id: string) {
    return this.leadsService.delete(id);
  }
}
