import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { LocationsService } from './locations.service';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  async checkLocation(
    @Body() body: { userId: string; latitude: number; longitude: number },
  ) {
    await this.locationsService.checkAndLogLocation(
      body.userId,
      body.latitude,
      body.longitude,
    );
    return { message: 'OK' };
  }

  @Get('logs')
  async getLocationLogs(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('userId') userId?: string,
  ) {
    return this.locationsService.getLocationLogs(page, limit, userId);
  }
}
