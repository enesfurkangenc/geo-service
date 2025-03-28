import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Area } from '../entities/area.entity';
import { MetricsService } from '../metrics/metrics.service';

export interface CreateAreaDto {
  name: string;
  coordinates: {
    type: string;
    coordinates: number[][];
  };
  description?: string;
}

@Injectable()
export class AreasService {
  constructor(
    @InjectRepository(Area)
    private areasRepository: Repository<Area>,
    private metricsService: MetricsService,
  ) {
    void this.updateAreaCountMetric();
  }

  async findAll(
    page = 1,
    limit = 10,
  ): Promise<{
    items: Area[];
    meta: { page: number; limit: number; total: number; pageCount: number };
  }> {
    const skip = (page - 1) * limit;

    const [items, total] = await this.areasRepository.findAndCount({
      skip,
      take: limit,
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      items,
      meta: {
        page,
        limit,
        total,
        pageCount: Math.ceil(total / limit),
      },
    };
  }

  async create(areaData: CreateAreaDto): Promise<Area> {
    if (
      !areaData.name ||
      !areaData.coordinates ||
      !areaData.coordinates.type ||
      !areaData.coordinates.coordinates
    ) {
      throw new Error('Geçersiz bölge verisi. Ad ve koordinatlar gereklidir.');
    }

    const newArea = this.areasRepository.create({
      name: areaData.name,
      coordinates: {
        type: areaData.coordinates.type,
        coordinates: areaData.coordinates.coordinates,
      },
      description: areaData.description,
    });

    const savedData = await this.areasRepository.save(newArea);

    void this.updateAreaCountMetric();

    return savedData;
  }

  private async updateAreaCountMetric(): Promise<void> {
    const count = await this.areasRepository.count();
    this.metricsService.setAreasTotal(count);
  }
}
