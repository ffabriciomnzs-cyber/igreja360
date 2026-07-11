import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@Controller('health')
export class HealthController {
  @Get()
  check(): {
    status: string;
    timestamp: string;
    commit: string;
  } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      // Permite confirmar qual build está no ar (Railway injeta o SHA do commit).
      commit: (
        process.env.RAILWAY_GIT_COMMIT_SHA ??
        process.env.GIT_COMMIT_SHA ??
        'dev'
      ).slice(0, 8),
    };
  }
}
