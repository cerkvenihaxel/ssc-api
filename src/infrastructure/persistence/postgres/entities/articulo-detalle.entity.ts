import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { ArticuloEntity } from './articulo.entity';

@Entity('articulos_detalles')
export class ArticuloDetalleEntity {
  @PrimaryColumn('uuid', { name: 'articulo_id' })
  articuloId: string;

  @Column({ name: 'id_marca', type: 'integer', nullable: true })
  idMarca: number | null;

  @Column({ name: 'precio_com_siva', type: 'decimal', precision: 10, scale: 2, nullable: true })
  precioComSiva: number | null;

  @Column({ name: 'precio_vta_siva', type: 'decimal', precision: 10, scale: 2, nullable: true })
  precioVtaSiva: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relación
  @OneToOne(() => ArticuloEntity, articulo => articulo.detalle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'articulo_id' })
  articulo: ArticuloEntity;
} 