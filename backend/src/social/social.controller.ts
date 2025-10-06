import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SocialService } from './social.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Social Media')
@Controller('social')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class SocialController {
  constructor(private socialService: SocialService) {}

  @Get('posts')
  @ApiOperation({ summary: 'Get all social posts' })
  async getPosts(@CurrentUser() user: any, @Query() filters: any) {
    return this.socialService.getPosts(user.companyId, filters);
  }

  @Post('posts')
  @ApiOperation({ summary: 'Create social post' })
  async createPost(@CurrentUser() user: any, @Body() postData: any) {
    return this.socialService.createPost({
      ...postData,
      company_id: user.companyId,
      created_by: user.id,
    });
  }

  @Post('posts/:id/publish')
  @ApiOperation({ summary: 'Publish social post' })
  async publishPost(@Param('id') id: string) {
    return this.socialService.publishPost(id);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get social media metrics' })
  async getMetrics(
    @CurrentUser() user: any,
    @Query('platform') platform?: string,
  ) {
    return this.socialService.getMetrics(user.companyId, platform);
  }

  @Post('metrics/sync')
  @ApiOperation({ summary: 'Sync social media metrics' })
  async syncMetrics(
    @CurrentUser() user: any,
    @Body('platform') platform: string,
  ) {
    return this.socialService.syncMetrics(user.companyId, platform);
  }
}
