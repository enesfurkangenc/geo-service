import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { PostGisHealthIndicator } from './postgis.health';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private postgis: PostGisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Veritabanı bağlantısı kontrolü
      () => this.db.pingCheck('database', { timeout: 3000 }),

      // PostGIS uzantısı kontrolü
      () => this.postgis.isPostGisActive('postgis'),

      // Bellek kullanımı kontrolü (maksimum 500MB)
      () => this.memory.checkHeap('memory_heap', 500 * 1024 * 1024),

      // Disk alanı kontrolü (en fazla %90 kullanım)
      () =>
        this.disk.checkStorage('disk', { path: '/', thresholdPercent: 0.9 }),
    ]);
  }

  @Get('db')
  @HealthCheck()
  dbCheck() {
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: 3000 }),
      () => this.postgis.isPostGisActive('postgis'),
    ]);
  }

  @Get('storage')
  @HealthCheck()
  storageCheck() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 500 * 1024 * 1024),
      () =>
        this.disk.checkStorage('disk', { path: '/', thresholdPercent: 0.9 }),
    ]);
  }
}
