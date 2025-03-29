import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import './tracing';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const microservice = app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'geo-service-client',
        brokers: [
          `${process.env.KAFKA_HOST || 'kafka'}:${process.env.KAFKA_PORT || '9092'}`,
        ],
      },
      consumer: {
        groupId: 'geo-service-consumer',
      },
    },
  });

  await app.startAllMicroservices();

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;
  await app.listen(port);
}

bootstrap().catch((error) => {
  console.error('Bootstrap hatası:', error);
  process.exit(1);
});
