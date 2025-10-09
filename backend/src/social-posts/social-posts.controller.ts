import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { SocialPostsService } from './social-posts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('social-posts')
@UseGuards(JwtAuthGuard)
export class SocialPostsController {
  constructor(private readonly socialPostsService: SocialPostsService) {}

  @Post()
  create(@Request() req, @Body() createDto: any) {
    return this.socialPostsService.create(req.user.id, createDto);
  }

  @Get()
  findAll(@Request() req, @Query() filters: any) {
    return this.socialPostsService.findAll(req.user.id, filters);
  }

  @Get('scheduled')
  getScheduled(@Request() req) {
    return this.socialPostsService.findAll(req.user.id, { status: 'scheduled' });
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.socialPostsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateDto: any) {
    return this.socialPostsService.update(id, req.user.id, updateDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.socialPostsService.remove(id, req.user.id);
  }

  @Post(':id/publish')
  async publish(@Request() req, @Param('id') id: string) {
    const post = await this.socialPostsService.findOne(id, req.user.id);

    // TODO: Implement actual publishing logic to social platforms
    // For now, just update status to published
    return this.socialPostsService.updateStatus(id, 'published');
  }

  @Post(':id/schedule')
  async schedule(
    @Request() req,
    @Param('id') id: string,
    @Body('scheduled_for') scheduledFor: string,
  ) {
    return this.socialPostsService.update(id, req.user.id, {
      scheduled_for: scheduledFor,
      status: 'scheduled',
    });
  }
}
