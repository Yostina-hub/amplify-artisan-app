import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Tickets')
@Controller('tickets')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tickets' })
  async findAll(@CurrentUser() user: any, @Query() filters: any) {
    return this.ticketsService.findAll(user.companyId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tickets by ID' })
  async findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create tickets' })
  async create(@CurrentUser() user: any, @Body() createData: any) {
    return this.ticketsService.create({ ...createData, company_id: user.companyId });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update tickets' })
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.ticketsService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete tickets' })
  async delete(@Param('id') id: string) {
    return this.ticketsService.delete(id);
  }
}
