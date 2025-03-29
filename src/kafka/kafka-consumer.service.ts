import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KafkaContext } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LocationLog } from '../entities/location-log.entity';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class KafkaConsumerService implements OnModuleInit {
  private readonly logger = new Logger(KafkaConsumerService.name);

  constructor(
    @InjectRepository(LocationLog)
    private readonly locationLogRepository: Repository<LocationLog>,
    private readonly metricsService: MetricsService,
  ) {}

  async onModuleInit() {
    this.logger.log('Kafka Consumer Service initialized');
  }

  async consumeLocationEvent(message: any, context: KafkaContext) {
    try {
      this.logger.log(
        `Received message in service: ${JSON.stringify(message)}`,
      );

      let payload;
      if (message.value) {
        payload =
          typeof message.value === 'string'
            ? JSON.parse(message.value)
            : message.value;
      } else if (message.id && message.data) {
        payload = message;
      } else {
        this.logger.warn('Received empty or invalid message');
        return;
      }

      if (!payload.data) {
        this.logger.warn('Invalid message format: missing data property');
        return;
      }

      const data = payload.data;
      if (!data.userId || !data.areaId) {
        this.logger.warn(
          'Invalid location data: missing required fields',
          JSON.stringify(data),
        );
        return;
      }

      const locationLog = this.locationLogRepository.create({
        userId: data.userId,
        areaId: data.areaId,
        location: data.locationPoint,
      });

      await this.locationLogRepository.save(locationLog);

      await this.updateLocationCountMetric();

      return { success: true, logId: locationLog.id };
    } catch (error) {
      this.logger.error(
        `Error processing location event: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private async updateLocationCountMetric(): Promise<void> {
    try {
      const count = await this.locationLogRepository.count();
      this.metricsService.setLocationsTotal(count);
    } catch (error) {
      this.logger.error(
        `Error updating location count metric: ${error.message}`,
      );
    }
  }
}
