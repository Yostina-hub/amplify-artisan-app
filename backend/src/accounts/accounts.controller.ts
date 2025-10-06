import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Accounts')
@Controller('accounts')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all accounts' })
  async findAll(@CurrentUser() user: any, @Query() filters: any) {
    return this.accountsService.findAll(user.companyId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID' })
  async findOne(@Param('id') id: string) {
    return this.accountsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create account' })
  async create(@CurrentUser() user: any, @Body() createData: any) {
    return this.accountsService.create({ ...createData, company_id: user.companyId });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update account' })
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.accountsService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete account' })
  async delete(@Param('id') id: string) {
    return this.accountsService.delete(id);
  }
}
