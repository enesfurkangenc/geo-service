import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AreasModule } from './areas/areas.module';
import { LocationsModule } from './locations/locations.module';
import { Area } from './entities/area.entity';
import { LocationLog } from './entities/location-log.entity';
import { Outbox } from './entities/outbox.entity';
import { CircuitBreakerModule } from './common/circuit-breaker/circuit-breaker.module';
import { HealthModule } from './health/health.module';
import { ConfigModule } from '@nestjs/config';
import { MetricsModule } from './metrics/metrics.module';
import { MetricsMiddleware } from './metrics/metrics.middleware';
import { KafkaModule } from './kafka/kafka.module';
import { dataSourceOptions } from './database/datasource';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      ...dataSourceOptions,
      entities: [Area, LocationLog, Outbox],
      autoLoadEntities: true,
    }),
    CircuitBreakerModule,
    AreasModule,
    LocationsModule,
    HealthModule,
    MetricsModule,
    KafkaModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware).forRoutes('*'); // Tüm route'lar için uygula
  }
}
