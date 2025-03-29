import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { LocationLog } from '../entities/location-log.entity';
import { Area } from '../entities/area.entity';
import { Outbox } from '../entities/outbox.entity';
import { RetryService } from '../common/retry.service';
import { CircuitBreakerModule } from '../common/circuit-breaker/circuit-breaker.module';
import { MetricsModule } from '../metrics/metrics.module';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LocationLog, Area, Outbox]),
    CircuitBreakerModule,
    MetricsModule,
    KafkaModule,
  ],
  controllers: [LocationsController],
  providers: [LocationsService, RetryService],
})
export class LocationsModule {}
