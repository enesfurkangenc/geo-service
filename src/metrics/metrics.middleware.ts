/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const start = process.hrtime();
    const method = req.method;
    const path = this.getRoutePath(req);

    this.metricsService.incrementHttpRequestsInProgress(method, path);

    res.on('finish', () => {
      const duration = this.getDurationInSeconds(start);
      this.metricsService.recordHttpRequest(
        method,
        res.statusCode,
        path,
        duration,
      );
      this.metricsService.decrementHttpRequestsInProgress(method, path);
    });

    next();
  }

  private getRoutePath(req: Request): string {
    const url =
      req.baseUrl + (req.route && req.route.path ? req.route.path : req.path);
    return url
      .split('/')
      .map((segment) => {
        // Eğer segment bir sayı veya UUID ise parametreleştir
        return /^[0-9]+$/.test(segment) ? ':id' : segment;
      })
      .join('/');
  }

  private getDurationInSeconds(start: [number, number]): number {
    const diff = process.hrtime(start);
    return diff[0] + diff[1] / 1e9;
  }
}
