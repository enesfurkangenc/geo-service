import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Area } from './area.entity';

@Entity()
export class LocationLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  userId: string;

  @Column()
  @Index()
  areaId: number;

  @Column('point')
  location: string;

  @CreateDateColumn()
  entryTime: Date;

  @ManyToOne(() => Area)
  @JoinColumn({ name: 'areaId' })
  area: Area;
}
