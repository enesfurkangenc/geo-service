import { Controller, Logger } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  KafkaContext,
  Payload,
} from '@nestjs/microservices';
import { KafkaConsumerService } from './kafka-consumer.service';

@Controller()
export class KafkaController {
  private readonly logger = new Logger(KafkaController.name);

  constructor(private readonly kafkaConsumerService: KafkaConsumerService) {}

  @EventPattern('location-events')
  async handleLocationEvent(
    @Payload() message: any,
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`Received message from topic: ${context.getTopic()}`);
    try {
      const result = await this.kafkaConsumerService.consumeLocationEvent(
        message,
        context,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Error in handleLocationEvent: ${error.message}`,
        error.stack,
      );
      // Burada hata yönetimine göre yönlendirme yapılabilir
      // Örneğin, Dead Letter Queue'ya gönderme vb.
      throw error;
    }
  }
}
