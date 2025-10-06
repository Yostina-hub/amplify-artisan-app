import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { BranchesModule } from './branches/branches.module';
import { LeadsModule } from './leads/leads.module';
import { ContactsModule } from './contacts/contacts.module';
import { AccountsModule } from './accounts/accounts.module';
import { ProductsModule } from './products/products.module';
import { InvoicesModule } from './invoices/invoices.module';
import { QuotesModule } from './quotes/quotes.module';
import { DealsModule } from './deals/deals.module';
import { ProjectsModule } from './projects/projects.module';
import { ContractsModule } from './contracts/contracts.module';
import { DocumentsModule } from './documents/documents.module';
import { FormsModule } from './forms/forms.module';
import { TicketsModule } from './tickets/tickets.module';
import { CallReportsModule } from './call-reports/call-reports.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { InfluencersModule } from './influencers/influencers.module';
import { BrandMentionsModule } from './brand-mentions/brand-mentions.module';
import { SocialMessagesModule } from './social-messages/social-messages.module';
import { TerritoriesModule } from './territories/territories.module';
import { AgentsModule } from './agents/agents.module';
import { ReportsModule } from './reports/reports.module';
import { WorkflowsModule } from './workflows/workflows.module';
import { SocialModule } from './social/social.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PaymentsModule } from './payments/payments.module';
import { EmailModule } from './email/email.module';
import { AutomationModule } from './automation/automation.module';
import { CallCenterModule } from './call-center/call-center.module';
import { ActivitiesModule } from './activities/activities.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    CompaniesModule,
    BranchesModule,
    LeadsModule,
    ContactsModule,
    AccountsModule,
    ProductsModule,
    InvoicesModule,
    QuotesModule,
    DealsModule,
    ProjectsModule,
    ContractsModule,
    DocumentsModule,
    FormsModule,
    TicketsModule,
    CallReportsModule,
    CampaignsModule,
    InfluencersModule,
    BrandMentionsModule,
    SocialMessagesModule,
    TerritoriesModule,
    AgentsModule,
    ReportsModule,
    WorkflowsModule,
    SocialModule,
    AnalyticsModule,
    PaymentsModule,
    EmailModule,
    AutomationModule,
    CallCenterModule,
    ActivitiesModule,
  ],
})
export class AppModule {}
