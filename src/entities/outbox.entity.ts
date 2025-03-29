import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum OutboxStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

export enum OutboxEventType {
  LOCATION_CREATED = 'LOCATION_CREATED',
}

@Entity()
export class Outbox {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  aggregateType: string;

  @Column()
  @Index()
  aggregateId: string;

  @Column({
    type: 'enum',
    enum: OutboxEventType,
  })
  @Index()
  eventType: OutboxEventType;

  @Column('jsonb')
  payload: Record<string, any>;

  @Column({
    type: 'enum',
    enum: OutboxStatus,
    default: OutboxStatus.PENDING,
  })
  @Index()
  status: OutboxStatus;

  @Column({ nullable: true })
  errorMessage?: string;

  @Column({ default: 0 })
  retryCount: number;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @Column({ nullable: true })
  processedAt?: Date;
}
