import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AreasService } from './areas.service';
import { Area } from '../entities/area.entity';

@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Post()
  create(
    @Body()
    createAreaDto: {
      name: string;
      coordinates: { type: string; coordinates: number[][] };
      description?: string;
    },
  ): Promise<Area> {
    return this.areasService.create(createAreaDto);
  }

  @Get()
  findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.areasService.findAll(+page, +limit);
  }
}
