import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Documents')
@Controller('documents')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all documents' })
  async findAll(@CurrentUser() user: any, @Query() filters: any) {
    return this.documentsService.findAll(user.companyId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get documents by ID' })
  async findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create documents' })
  async create(@CurrentUser() user: any, @Body() createData: any) {
    return this.documentsService.create({ ...createData, company_id: user.companyId });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update documents' })
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.documentsService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete documents' })
  async delete(@Param('id') id: string) {
    return this.documentsService.delete(id);
  }
}
