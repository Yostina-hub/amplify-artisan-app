import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Contracts')
@Controller('contracts')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ContractsController {
  constructor(private contractsService: ContractsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all contracts' })
  async findAll(@CurrentUser() user: any, @Query() filters: any) {
    return this.contractsService.findAll(user.companyId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contracts by ID' })
  async findOne(@Param('id') id: string) {
    return this.contractsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create contracts' })
  async create(@CurrentUser() user: any, @Body() createData: any) {
    return this.contractsService.create({ ...createData, company_id: user.companyId });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update contracts' })
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.contractsService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete contracts' })
  async delete(@Param('id') id: string) {
    return this.contractsService.delete(id);
  }
}
