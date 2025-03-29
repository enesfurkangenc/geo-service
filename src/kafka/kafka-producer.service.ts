import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Outbox, OutboxStatus } from '../entities/outbox.entity';

@Injectable()
export class KafkaProducerService implements OnModuleInit {
  private readonly logger = new Logger(KafkaProducerService.name);
  private isConnected = false;

  constructor(
    @Inject('KAFKA_CLIENT') private readonly kafkaClient: ClientKafka,
    @InjectRepository(Outbox)
    private readonly outboxRepository: Repository<Outbox>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    try {
      await this.kafkaClient.connect();
      this.isConnected = true;
      this.logger.log('Successfully connected to Kafka');
    } catch (error) {
      this.logger.error(
        `Failed to connect to Kafka: ${error.message}`,
        error.stack,
      );
      this.isConnected = false;
    }
  }

  async sendMessage(topic: string, key: string, value: any): Promise<boolean> {
    if (!this.isConnected) {
      this.logger.warn(
        'Kafka client is not connected. Message will not be sent.',
      );
      return false;
    }

    try {
      this.logger.log(`Sending message to topic: ${topic} with key: ${key}`);

      const message = {
        key,
        value: typeof value === 'string' ? value : JSON.stringify(value),
      };

      await this.kafkaClient.emit(topic, message).toPromise();

      this.logger.log(`Message sent successfully to topic: ${topic}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send message to Kafka topic ${topic}: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  // Her 10 saniyede bir outbox işlemesi için cron job
  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleOutboxProcessing() {
    if (!this.isConnected) {
      this.logger.warn(
        'Kafka client is not connected. Skipping outbox processing.',
      );
      try {
        await this.kafkaClient.connect();
        this.isConnected = true;
        this.logger.log('Reconnected to Kafka successfully');
      } catch (error) {
        this.logger.error(`Failed to reconnect to Kafka: ${error.message}`);
        return;
      }
    }

    this.logger.log('Running outbox processing cron job');
    await this.processOutboxEvents();
  }

  /**
   * Outbox tablosundan işlenmemiş mesajları bulup Kafka'ya gönderen relayer
   */
  async processOutboxEvents() {
    try {
      const pendingEvents = await this.outboxRepository.find({
        where: { status: OutboxStatus.PENDING },
        order: { createdAt: 'ASC' },
        take: 100, // Bir seferde işlenecek maksimum mesaj sayısı
      });

      this.logger.log(
        `Processing ${pendingEvents.length} pending outbox events`,
      );

      if (pendingEvents.length === 0) {
        return;
      }

      for (const event of pendingEvents) {
        try {
          const topic = `${event.aggregateType}-events`;
          const message = {
            id: event.id,
            type: event.eventType,
            data: event.payload,
            timestamp: new Date().toISOString(),
          };

          this.logger.log(
            `Sending message to topic: ${topic} with ID: ${event.id}`,
          );

          // Kafka'ya mesajı gönder
          await this.kafkaClient
            .emit(topic, {
              key: event.aggregateId,
              value: JSON.stringify(message),
            })
            .toPromise();

          // Outbox kaydını güncelle
          await this.outboxRepository.update(
            { id: event.id },
            {
              status: OutboxStatus.PROCESSED,
              processedAt: new Date(),
            },
          );

          this.logger.log(
            `Processed outbox event ID: ${event.id}, topic: ${topic}`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to process outbox event ID: ${event.id}: ${error.message}`,
            error.stack,
          );

          // Hata durumunda retry counter artır ve hata mesajını kaydet
          await this.outboxRepository.update(
            { id: event.id },
            {
              status: OutboxStatus.FAILED,
              errorMessage: error.message,
              retryCount: event.retryCount + 1,
            },
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Error in processOutboxEvents: ${error.message}`,
        error.stack,
      );
    }
  }
}
