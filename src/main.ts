import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import './tracing';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;
  await app.listen(port);
}

bootstrap().catch((error) => {
  console.error('Bootstrap hatası:', error);
  process.exit(1);
});
