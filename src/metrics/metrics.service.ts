import { Injectable } from '@nestjs/common';
import { Counter, Gauge, Histogram, Registry } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry: Registry;
  private readonly httpRequestsTotal: Counter;
  private readonly httpRequestDuration: Histogram;
  private readonly httpRequestsInProgress: Gauge;
  private readonly areasTotal: Gauge;
  private readonly locationsTotal: Gauge;

  constructor() {
    this.registry = new Registry();

    // HTTP istek sayaçları
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Toplam HTTP istek sayısı',
      labelNames: ['method', 'statusCode', 'path'],
      registers: [this.registry],
    });

    // HTTP istek süresi histogramı
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP istek süresi (saniye)',
      labelNames: ['method', 'statusCode', 'path'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
      registers: [this.registry],
    });

    // İşlemdeki HTTP istekleri göstergesi
    this.httpRequestsInProgress = new Gauge({
      name: 'http_requests_in_progress',
      help: 'İşlemdeki HTTP isteklerinin sayısı',
      labelNames: ['method', 'path'],
      registers: [this.registry],
    });

    // Bölge sayısı göstergesi
    this.areasTotal = new Gauge({
      name: 'geo_areas_total',
      help: 'Toplam bölge sayısı',
      registers: [this.registry],
    });

    // Konum kayıt sayısı göstergesi
    this.locationsTotal = new Gauge({
      name: 'geo_locations_total',
      help: 'Toplam konum kayıt sayısı',
      registers: [this.registry],
    });
  }

  // HTTP istek ölçümleri
  recordHttpRequest(
    method: string,
    statusCode: number,
    path: string,
    duration: number,
  ): void {
    this.httpRequestsTotal.inc({ method, statusCode, path });
    this.httpRequestDuration.observe({ method, statusCode, path }, duration);
  }

  incrementHttpRequestsInProgress(method: string, path: string): void {
    this.httpRequestsInProgress.inc({ method, path });
  }

  decrementHttpRequestsInProgress(method: string, path: string): void {
    this.httpRequestsInProgress.dec({ method, path });
  }

  // İş mantığı ölçümleri
  setAreasTotal(count: number): void {
    this.areasTotal.set(count);
  }

  setLocationsTotal(count: number): void {
    this.locationsTotal.set(count);
  }

  async updateLocationCountMetric(): Promise<void> {}

  getRegistry(): Registry {
    return this.registry;
  }
}
