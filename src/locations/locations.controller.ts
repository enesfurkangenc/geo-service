import { Controller, Post, Body, Get, Query, Logger } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { LocationCheckDto } from './dto/location-check.dto';

@Controller('locations')
export class LocationsController {
  private readonly logger = new Logger(LocationsController.name);

  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  async checkLocation(@Body() body: LocationCheckDto) {
    try {
      if (!body.userId || !body.latitude || !body.longitude) {
        this.logger.error('Eksik parametreler', JSON.stringify(body));
        return { message: 'Eksik parametre' };
      }

      await this.locationsService.checkAndLogLocation(
        body.userId,
        body.latitude,
        body.longitude,
      );

      return { message: 'OK' };
    } catch (error) {
      return {
        message: 'Hata',
        error: error.message,
      };
    }
  }

  @Get('logs')
  async getLocationLogs(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('userId') userId?: string,
  ) {
    try {
      const pageNumber = Number(page);
      const limitNumber = Number(limit);

      return await this.locationsService.getLocationLogs(
        pageNumber,
        limitNumber,
        userId,
      );
    } catch (error) {
      this.logger.error(
        `Konum logları alınırken hata: ${error.message}`,
        error.stack,
      );
      return {
        message: 'Hata',
        error: error.message,
      };
    }
  }
}
