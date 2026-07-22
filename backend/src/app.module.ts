import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
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
import { DevotionalsModule } from './devotionals/devotionals.module';
import { PushModule } from './push/push.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Limite global anti-abuso: 200 req/min por IP (rotas sensíveis, como
    // login, têm limite mais estrito via @Throttle).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 200 }]),
    // Tarefas diárias (lembrete de culto, aniversariantes) — ver
    // push/notifications.scheduler.ts.
    ScheduleModule.forRoot(),
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
    DevotionalsModule,
    PushModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
