import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Area } from '../entities/area.entity';
import { LocationLog } from '../entities/location-log.entity';
import { RetryService } from '../common/retry.service';
import { CircuitBreakerService } from '../common/circuit-breaker/circuit-breaker.provider';
import { MetricsService } from '../metrics/metrics.service';
import {
  Outbox,
  OutboxEventType,
  OutboxStatus,
} from '../entities/outbox.entity';

@Injectable()
export class LocationsService {
  private readonly logger = new Logger(LocationsService.name);

  constructor(
    @InjectRepository(Area)
    private areasRepository: Repository<Area>,
    @InjectRepository(LocationLog)
    private locationLogsRepository: Repository<LocationLog>,
    @InjectRepository(Outbox)
    private outboxRepository: Repository<Outbox>,
    private retryService: RetryService,
    private circuitBreakerService: CircuitBreakerService,
    private metricsService: MetricsService,
    private dataSource: DataSource,
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

      await this.dataSource.transaction(async (transactionalEntityManager) => {
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

        if (containingAreas.length > 0) {
          for (const area of containingAreas) {
            const outboxEvent = this.outboxRepository.create({
              aggregateType: 'location',
              aggregateId: `${userId}-${area.id}-${Date.now()}`,
              eventType: OutboxEventType.LOCATION_CREATED,
              payload: {
                userId,
                latitude,
                longitude,
                areaId: area.id,
                locationPoint: userPoint,
                timestamp: new Date().toISOString(),
              },
              status: OutboxStatus.PENDING,
            });

            await transactionalEntityManager.save(outboxEvent);

            this.logger.log(
              `Location event created for user ${userId} in area ${area.id}`,
            );
          }
        }
      });
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

  async updateLocationCountMetric(): Promise<void> {
    const count = await this.locationLogsRepository.count();
    this.metricsService.setLocationsTotal(count);
  }
}
