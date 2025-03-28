import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

interface PostgresQueryResult {
  postgis_version: string;
}

@Injectable()
export class PostGisHealthIndicator extends HealthIndicator {
  constructor(@InjectConnection() private connection: Connection) {
    super();
  }

  async isPostGisActive(key: string): Promise<HealthIndicatorResult> {
    try {
      // PostGIS versiyonunu kontrol et
      const result: unknown = await this.connection.query(
        'SELECT PostGIS_version()',
      );
      const queryResults = Array.isArray(result)
        ? (result as PostgresQueryResult[])
        : [];
      const isPostGisActive = queryResults.length > 0;

      if (isPostGisActive) {
        return this.getStatus(key, true, {
          version: queryResults[0].postgis_version,
        });
      }

      return this.getStatus(key, false, {
        message: 'PostGIS uzantısı aktif değil veya bulunamadı',
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Bilinmeyen hata';
      return this.getStatus(key, false, {
        message: `PostGIS uzantısı kontrolü sırasında hata: ${errorMessage}`,
      });
    }
  }
}
