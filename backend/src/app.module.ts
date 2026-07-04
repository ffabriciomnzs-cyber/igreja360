import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MembersModule } from './members/members.module';
import { CellsModule } from './cells/cells.module';
import { FinancialModule } from './financial/financial.module';
import { EventsModule } from './events/events.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { CommunicationsModule } from './communications/communications.module';
import { PrayersModule } from './prayers/prayers.module';
import { ReportsModule } from './reports/reports.module';
import { SettingsModule } from './settings/settings.module';
import { WorshipModule } from './worship/worship.module';
import { UsersModule } from './users/users.module';
import { MemberAuthModule } from './member-auth/member-auth.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    MembersModule,
    CellsModule,
    FinancialModule,
    EventsModule,
    CampaignsModule,
    CommunicationsModule,
    PrayersModule,
    ReportsModule,
    SettingsModule,
    WorshipModule,
    UsersModule,
    MemberAuthModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
