import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PostGisHealthIndicator } from './postgis.health';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [PostGisHealthIndicator],
})
export class HealthModule {}
