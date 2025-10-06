#!/bin/bash

# Array of module names (singular for table, plural for module)
declare -A modules=(
  ["products"]="product"
  ["invoices"]="invoice"
  ["quotes"]="quote"
  ["sales-pipeline"]="deal"
  ["project-management"]="project"
  ["contract-management"]="contract"
  ["documents"]="document"
  ["form-builder"]="form"
  ["customer-support"]="ticket"
  ["call-reports"]="call_report"
  ["ad-campaigns"]="ad_campaign"
  ["influencer-marketing"]="influencer_campaign"
  ["brand-monitoring"]="brand_mention"
  ["social-listening"]="social_mention"
  ["social-inbox"]="social_message"
  ["territory-management"]="territory"
  ["agents"]="agent"
  ["reporting"]="report"
  ["workflow-builder"]="workflow"
  ["ai-studio"]="ai_content"
  ["ai-analytics"]="ai_insight"
)

for module in "${!modules[@]}"; do
  table="${modules[$module]}"

  # Create module file
  cat > "src/${module}/${module}.module.ts" << EOF
import { Module } from '@nestjs/common';
import { ${module^}Controller } from './${module}.controller';
import { ${module^}Service } from './${module}.service';

@Module({
  controllers: [${module^}Controller],
  providers: [${module^}Service],
  exports: [${module^}Service],
})
export class ${module^}Module {}
EOF

  # Create service file
  cat > "src/${module}/${module}.service.ts" << EOF
import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class ${module^}Service {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
  }

  async findAll(companyId: string, filters?: any) {
    let query = this.supabase
      .from('${table}s')
      .select('*')
      .eq('company_id', companyId);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .from('${table}s')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async create(createData: any) {
    const { data, error } = await this.supabase
      .from('${table}s')
      .insert(createData)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async update(id: string, updateData: any) {
    const { data, error } = await this.supabase
      .from('${table}s')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async delete(id: string) {
    const { error } = await this.supabase.from('${table}s').delete().eq('id', id);
    if (error) throw error;
    return { message: '${module^} deleted successfully' };
  }
}
EOF

  # Create controller file
  cat > "src/${module}/${module}.controller.ts" << EOF
import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ${module^}Service } from './${module}.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('${module^}')
@Controller('${module}')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ${module^}Controller {
  constructor(private ${module}Service: ${module^}Service) {}

  @Get()
  @ApiOperation({ summary: 'Get all ${module}' })
  async findAll(@CurrentUser() user: any, @Query() filters: any) {
    return this.${module}Service.findAll(user.companyId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ${module} by ID' })
  async findOne(@Param('id') id: string) {
    return this.${module}Service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create ${module}' })
  async create(@CurrentUser() user: any, @Body() createData: any) {
    return this.${module}Service.create({ ...createData, company_id: user.companyId });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update ${module}' })
  async update(@Param('id') id: string, @Body() updateData: any) {
    return this.${module}Service.update(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete ${module}' })
  async delete(@Param('id') id: string) {
    return this.${module}Service.delete(id);
  }
}
EOF

  echo "Generated $module module"
done

echo "All modules generated!"
