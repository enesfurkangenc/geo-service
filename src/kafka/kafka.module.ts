import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KafkaController } from './kafka.controller';
import { KafkaProducerService } from './kafka-producer.service';
import { KafkaConsumerService } from './kafka-consumer.service';
import { LocationLog } from '../entities/location-log.entity';
import { Outbox } from '../entities/outbox.entity';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LocationLog, Outbox]),
    MetricsModule,
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_CLIENT',
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'geo-service-client',
              brokers: [
                `${configService.get<string>('KAFKA_HOST') || 'kafka'}:${
                  configService.get<string>('KAFKA_PORT') || '9092'
                }`,
              ],
              retry: {
                initialRetryTime: 300,
                retries: 10,
              },
            },
            consumer: {
              groupId: 'geo-service-consumer',
              allowAutoTopicCreation: true,
              maxWaitTimeInMs: 5000,
              sessionTimeout: 30000,
              heartbeatInterval: 3000,
            },
            producer: {
              allowAutoTopicCreation: true,
              transactionalId: 'geo-service-producer-tx',
            },
            subscribe: {
              fromBeginning: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [KafkaController],
  providers: [KafkaProducerService, KafkaConsumerService],
  exports: [KafkaProducerService, KafkaConsumerService],
})
export class KafkaModule {}
