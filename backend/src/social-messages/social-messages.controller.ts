import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SocialMessagesService } from './social-messages.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('SocialMessages')
@Controller('social-messages')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class SocialMessagesController {
  constructor(private socialmessagesService: SocialMessagesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all social-messages' })
  async findAll(@CurrentUser() user: any, @Query() filters: any) {
    return this.socialmessagesService.findAll(user.companyId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get social-messages by ID' })
  async findOne(@Param('id') id: string) {
    return this.socialmessagesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create social-messages' })
  async create(@CurrentUser() user: any, @Body() createData: any) {
    return this.socialmessagesService.create({ ...createData, company_id: user.companyId });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update social-messages' })
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.socialmessagesService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete social-messages' })
  async delete(@Param('id') id: string) {
    return this.socialmessagesService.delete(id);
  }
}
