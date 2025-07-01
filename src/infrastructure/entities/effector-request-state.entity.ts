import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('effector_request_states')
export class EffectorRequestStateEntity {
  @PrimaryGeneratedColumn('uuid')
  state_id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  state_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 