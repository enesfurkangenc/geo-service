import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Area } from '../entities/area.entity';
import { LocationLog } from '../entities/location-log.entity';
import { RetryService } from '../common/retry.service';
import { CircuitBreakerService } from '../common/circuit-breaker/circuit-breaker.provider';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class LocationsService {
  private readonly logger = new Logger(LocationsService.name);

  constructor(
    @InjectRepository(Area)
    private areasRepository: Repository<Area>,
    @InjectRepository(LocationLog)
    private locationLogsRepository: Repository<LocationLog>,
    private retryService: RetryService,
    private circuitBreakerService: CircuitBreakerService,
    private metricsService: MetricsService,
  ) {
    void this.updateLocationCountMetric();
  }

  async checkAndLogLocation(
    userId: string,
    latitude: number,
    longitude: number,
  ): Promise<void> {
    return this.circuitBreakerService.executeLocationServiceCall(async () => {
      const userPoint = `(${longitude},${latitude})`;

      // ST_Contains fonksiyonu ile noktanın alan içinde olup olmadığını kontrol et
      const containingAreas = await this.retryService.withRetry(async () => {
        return this.areasRepository
          .createQueryBuilder('area')
          .where(
            `ST_Contains(ST_GeomFromGeoJSON(area.coordinates::text), ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326))`,
            {
              longitude,
              latitude,
            },
          )
          .getMany();
      }, 'checkLocationAreas');

      // Bulunan alanlar için log oluştur
      if (containingAreas.length > 0) {
        const logs = containingAreas.map((area) =>
          this.locationLogsRepository.create({
            userId,
            areaId: area.id,
            location: userPoint,
          }),
        );

        await this.retryService.withRetry(async () => {
          return this.locationLogsRepository.save(logs);
        }, 'saveLocationLogs');
      }

      // Metriği güncelle
      await this.updateLocationCountMetric();
    });
  }

  async getLocationLogs(page = 1, limit = 10, userId?: string) {
    return this.circuitBreakerService.executeLocationServiceCall(async () => {
      const skip = (page - 1) * limit;

      const queryBuilder = this.locationLogsRepository
        .createQueryBuilder('log')
        .leftJoinAndSelect('log.area', 'area')
        .skip(skip)
        .take(limit)
        .orderBy('log.entryTime', 'DESC');

      if (userId) {
        queryBuilder.where('log.userId = :userId', { userId });
      }

      const [items, total] = await this.retryService.withRetry(async () => {
        return queryBuilder.getManyAndCount();
      }, 'getLocationLogs');

      return {
        items,
        meta: {
          page,
          limit,
          total,
          pageCount: Math.ceil(total / limit),
        },
      };
    });
  }

  async getLocationLogsByUserId(userId: string) {
    return this.circuitBreakerService.executeLocationServiceCall(async () => {
      return this.retryService.withRetry(async () => {
        return this.locationLogsRepository.find({
          where: { userId },
          relations: ['area'],
        });
      }, 'getLocationLogsByUserId');
    });
  }

  private async updateLocationCountMetric(): Promise<void> {
    const count = await this.locationLogsRepository.count();
    this.metricsService.setLocationsTotal(count);
  }
}
