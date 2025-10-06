import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Quotes')
@Controller('quotes')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class QuotesController {
  constructor(private quotesService: QuotesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all quotes' })
  async findAll(@CurrentUser() user: any, @Query() filters: any) {
    return this.quotesService.findAll(user.companyId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quotes by ID' })
  async findOne(@Param('id') id: string) {
    return this.quotesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create quotes' })
  async create(@CurrentUser() user: any, @Body() createData: any) {
    return this.quotesService.create({ ...createData, company_id: user.companyId });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update quotes' })
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.quotesService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete quotes' })
  async delete(@Param('id') id: string) {
    return this.quotesService.delete(id);
  }
}
