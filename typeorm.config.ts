import { DataSource } from 'typeorm';
import { Area } from './src/entities/area.entity';
import { LocationLog } from './src/entities/location-log.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'geoservice',
  entities: [Area, LocationLog],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: true,
  ssl: false,
});
