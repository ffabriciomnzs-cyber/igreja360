import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MemberAuthService } from './member-auth.service';
import { PortalService } from './portal.service';
import { MemberAuthController } from './member-auth.controller';

@Module({
  imports: [JwtModule.register({})],
  controllers: [MemberAuthController],
  providers: [MemberAuthService, PortalService],
})
export class MemberAuthModule {}
