import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, ManyToMany, JoinTable, OneToOne } from 'typeorm';
import { ProveedorEntity } from './proveedor.entity';
import { GrupoArticuloEntity } from './grupo-articulo.entity';
import { ArticuloDetalleEntity } from './articulo-detalle.entity';

@Entity('articulos')
export class ArticuloEntity {
  @PrimaryColumn('uuid', { name: 'articulo_id' })
  articuloId: string;

  @Column('uuid', { name: 'provider_id' })
  providerId: string;

  @Column({ name: 'codigo', length: 20 })
  codigo: string;

  @Column({ name: 'nombre', length: 255 })
  nombre: string;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ name: 'presentacion', length: 255, nullable: true })
  presentacion: string | null;

  @Column({ name: 'precio', type: 'decimal', precision: 10, scale: 2 })
  precio: number;

  @Column({ name: 'stock', type: 'integer', nullable: true })
  stock: number | null;

  @Column({ name: 'last_price_update', type: 'timestamp', nullable: true })
  lastPriceUpdate: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relaciones
  @ManyToOne(() => ProveedorEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'provider_id' })
  proveedor: ProveedorEntity;

  @OneToOne(() => ArticuloDetalleEntity, detalle => detalle.articulo, { cascade: true })
  detalle: ArticuloDetalleEntity;

  @ManyToMany(() => GrupoArticuloEntity, grupo => grupo.articulos)
  @JoinTable({
    name: 'articulos_grupos',
    joinColumn: {
      name: 'articulo_id',
      referencedColumnName: 'articuloId'
    },
    inverseJoinColumn: {
      name: 'grupo_id',
      referencedColumnName: 'grupoId'
    }
  })
  grupos: GrupoArticuloEntity[];
} 