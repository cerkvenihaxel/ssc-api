import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Affiliate } from './affiliate.entity';

@Entity('address')
export class Address {
  @PrimaryGeneratedColumn('uuid', { 
    name: 'address_id'
  })
  id: string;

  @Column({ name: 'affiliate_id' })
  affiliateId: string;

  @Column()
  street: string;

  @Column({ nullable: true })
  number: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ name: 'postal_code', nullable: true })
  postalCode: string;

  @Column({ default: 'Argentina' })
  country: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Affiliate, affiliate => affiliate.addresses)
  @JoinColumn({ name: 'affiliate_id' })
  affiliate: Affiliate;
} 