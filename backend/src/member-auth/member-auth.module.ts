import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MemberAuthService } from './member-auth.service';
import { PortalService } from './portal.service';
import { MemberAuthController } from './member-auth.controller';
import { ArenaController } from '../arena/arena.controller';
import { ArenaService } from '../arena/arena.service';

@Module({
  imports: [JwtModule.register({})],
  // ArenaController mora aqui para reusar o MemberJwtGuard (JwtModule).
  controllers: [MemberAuthController, ArenaController],
  providers: [MemberAuthService, PortalService, ArenaService],
})
export class MemberAuthModule {}
