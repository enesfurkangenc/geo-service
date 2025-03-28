import { Module } from '@nestjs/common';
import { CircuitBreakerService } from './circuit-breaker.provider';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [CacheModule.register()],
  providers: [CircuitBreakerService],
  exports: [CircuitBreakerService],
})
export class CircuitBreakerModule {}
