import { Controller, Get, Header, Res } from '@nestjs/common';
import { Response } from 'express';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain')
  async getMetrics(@Res() response: Response): Promise<void> {
    const metrics = await this.metricsService.getRegistry().metrics();
    response.send(metrics);
  }
}
