import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Invoices')
@Controller('invoices')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all invoices' })
  async findAll(@CurrentUser() user: any, @Query() filters: any) {
    return this.invoicesService.findAll(user.companyId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoices by ID' })
  async findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create invoices' })
  async create(@CurrentUser() user: any, @Body() createData: any) {
    return this.invoicesService.create({ ...createData, company_id: user.companyId });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update invoices' })
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.invoicesService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete invoices' })
  async delete(@Param('id') id: string) {
    return this.invoicesService.delete(id);
  }
}
