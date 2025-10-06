import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Contacts')
@Controller('contacts')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ContactsController {
  constructor(private contactsService: ContactsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all contacts' })
  async findAll(@CurrentUser() user: any) {
    return this.contactsService.findAll(user.companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contact by ID' })
  async findOne(@Param('id') id: string) {
    return this.contactsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create contact' })
  async create(@CurrentUser() user: any, @Body() createData: any) {
    return this.contactsService.create({
      ...createData,
      company_id: user.companyId,
    });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update contact' })
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.contactsService.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete contact' })
  async delete(@Param('id') id: string) {
    return this.contactsService.delete(id);
  }
}
