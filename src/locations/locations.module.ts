import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { LocationLog } from '../entities/location-log.entity';
import { Area } from '../entities/area.entity';
import { RetryService } from '../common/retry.service';
import { CircuitBreakerModule } from '../common/circuit-breaker/circuit-breaker.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LocationLog, Area]),
    CircuitBreakerModule,
    MetricsModule,
  ],
  controllers: [LocationsController],
  providers: [LocationsService, RetryService],
})
export class LocationsModule {}
