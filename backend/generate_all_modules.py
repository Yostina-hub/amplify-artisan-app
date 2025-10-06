#!/usr/bin/env python3

modules_config = [
    ("invoices", "invoice"),
    ("quotes", "quote"),
    ("deals", "deal"),
    ("projects", "project"),
    ("contracts", "contract"),
    ("documents", "document"),
    ("forms", "form"),
    ("tickets", "ticket"),
    ("call-reports", "call_report"),
    ("campaigns", "campaign"),
    ("influencers", "influencer_campaign"),
    ("brand-mentions", "brand_mention"),
    ("social-messages", "social_message"),
    ("territories", "territory"),
    ("agents", "agent"),
    ("reports", "report"),
    ("workflows", "workflow"),
]

for module_name, table_name in modules_config:
    module_dir = f"src/{module_name}"
    
    # Module class name
    class_name = ''.join(word.capitalize() for word in module_name.split('-'))
    
    # Module file
    module_content = f"""import {{ Module }} from '@nestjs/common';
import {{ {class_name}Controller }} from './{module_name}.controller';
import {{ {class_name}Service }} from './{module_name}.service';

@Module({{
  controllers: [{class_name}Controller],
  providers: [{class_name}Service],
  exports: [{class_name}Service],
}})
export class {class_name}Module {{}}
"""
    
    # Service file
    service_content = f"""import {{ Injectable }} from '@nestjs/common';
import {{ createClient }} from '@supabase/supabase-js';

@Injectable()
export class {class_name}Service {{
  private supabase;

  constructor() {{
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
  }}

  async findAll(companyId: string, filters?: any) {{
    let query = this.supabase
      .from('{table_name}s')
      .select('*')
      .eq('company_id', companyId);

    const {{ data, error }} = await query.order('created_at', {{ ascending: false }});
    if (error) throw error;
    return data;
  }}

  async findOne(id: string) {{
    const {{ data, error }} = await this.supabase
      .from('{table_name}s')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }}

  async create(createData: any) {{
    const {{ data, error }} = await this.supabase
      .from('{table_name}s')
      .insert(createData)
      .select()
      .single();
    if (error) throw error;
    return data;
  }}

  async update(id: string, updateData: any) {{
    const {{ data, error }} = await this.supabase
      .from('{table_name}s')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }}

  async delete(id: string) {{
    const {{ error }} = await this.supabase.from('{table_name}s').delete().eq('id', id);
    if (error) throw error;
    return {{ message: '{class_name} deleted successfully' }};
  }}
}}
"""
    
    # Controller file
    controller_content = f"""import {{ Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query }} from '@nestjs/common';
import {{ AuthGuard }} from '@nestjs/passport';
import {{ ApiTags, ApiOperation, ApiBearerAuth }} from '@nestjs/swagger';
import {{ {class_name}Service }} from './{module_name}.service';
import {{ CurrentUser }} from '../common/decorators/current-user.decorator';

@ApiTags('{class_name}')
@Controller('{module_name}')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class {class_name}Controller {{
  constructor(private {module_name.replace('-', '')}Service: {class_name}Service) {{}}

  @Get()
  @ApiOperation({{ summary: 'Get all {module_name}' }})
  async findAll(@CurrentUser() user: any, @Query() filters: any) {{
    return this.{module_name.replace('-', '')}Service.findAll(user.companyId, filters);
  }}

  @Get(':id')
  @ApiOperation({{ summary: 'Get {module_name} by ID' }})
  async findOne(@Param('id') id: string) {{
    return this.{module_name.replace('-', '')}Service.findOne(id);
  }}

  @Post()
  @ApiOperation({{ summary: 'Create {module_name}' }})
  async create(@CurrentUser() user: any, @Body() createData: any) {{
    return this.{module_name.replace('-', '')}Service.create({{ ...createData, company_id: user.companyId }});
  }}

  @Put(':id')
  @ApiOperation({{ summary: 'Update {module_name}' }})
  async update(@Param('id') id: string, @Body() updateData: any) {{
    return this.{module_name.replace('-', '')}Service.update(id, updateData);
  }}

  @Delete(':id')
  @ApiOperation({{ summary: 'Delete {module_name}' }})
  async delete(@Param('id') id: string) {{
    return this.{module_name.replace('-', '')}Service.delete(id);
  }}
}}
"""
    
    # Write files
    with open(f"{module_dir}/{module_name}.module.ts", "w") as f:
        f.write(module_content)
    
    with open(f"{module_dir}/{module_name}.service.ts", "w") as f:
        f.write(service_content)
    
    with open(f"{module_dir}/{module_name}.controller.ts", "w") as f:
        f.write(controller_content)
    
    print(f"✓ Created {module_name} module")

print("\n✅ All modules generated successfully!")
