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
import { BranchesService } from './branches.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Branches')
@Controller('branches')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class BranchesController {
  constructor(private branchesService: BranchesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all branches' })
  async findAll(
    @CurrentUser() user: any,
    @Query('companyId') companyId?: string,
  ) {
    const filterCompanyId = user.role === 'super_admin' ? companyId : user.companyId;
    return this.branchesService.findAll(filterCompanyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get branch by ID' })
  async findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }

  @Post()
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Create branch' })
  async create(@Body() createData: any) {
    return this.branchesService.create(createData);
  }

  @Put(':id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Update branch' })
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.branchesService.update(id, updateData);
  }

  @Delete(':id')
  @Roles('admin', 'super_admin')
  @ApiOperation({ summary: 'Delete branch' })
  async delete(@Param('id') id: string) {
    return this.branchesService.delete(id);
  }
}
