import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { MemberPrincipal } from './member-jwt.guard';

export const CurrentMember = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): MemberPrincipal => {
    const req = ctx
      .switchToHttp()
      .getRequest<{ member: MemberPrincipal }>();
    return req.member;
  },
);
