import { DataSource, DataSourceOptions } from 'typeorm';
import { Area } from '../entities/area.entity';
import { LocationLog } from '../entities/location-log.entity';
import { Outbox } from '../entities/outbox.entity';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'postgres',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'geoservice',
  entities: [Area, LocationLog, Outbox],
  synchronize: true,
  logging: true,
};

export const AppDataSource = new DataSource(dataSourceOptions);
