import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MemberAuthService } from './member-auth.service';
import { PortalService } from './portal.service';
import { BirthdaysService } from './birthdays.service';
import { MemberAuthController } from './member-auth.controller';
import { ArenaController } from '../arena/arena.controller';
import { ArenaService } from '../arena/arena.service';
import { ArenaAdminController } from '../arena/arena-admin.controller';
import { SeasonsService } from '../arena/seasons.service';
import { DuelsService } from '../arena/duels.service';
import { FlashService } from '../arena/flash.service';
import { MissionsService } from '../arena/missions.service';
import { ProgressService } from '../arena/progress.service';

@Module({
  imports: [JwtModule.register({})],
  // ArenaController mora aqui para reusar o MemberJwtGuard (JwtModule).
  controllers: [MemberAuthController, ArenaController, ArenaAdminController],
  providers: [
    MemberAuthService,
    PortalService,
    ArenaService,
    BirthdaysService,
    SeasonsService,
    DuelsService,
    FlashService,
    MissionsService,
    ProgressService,
  ],
})
export class MemberAuthModule {}
