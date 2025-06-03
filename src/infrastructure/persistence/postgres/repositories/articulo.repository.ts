import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, In } from 'typeorm';
import { IArticuloRepository, ArticuloFilters } from '../../../../domain/repositories/articulo/articulo.repository';
import { Articulo } from '../../../../domain/entities/articulo.entity';
import { ArticuloEntity } from '../entities/articulo.entity';
import { GrupoArticuloEntity } from '../entities/grupo-articulo.entity';

@Injectable()
export class PostgresArticuloRepository implements IArticuloRepository {
  constructor(
    @InjectRepository(ArticuloEntity)
    private readonly articuloRepository: Repository<ArticuloEntity>,
    @InjectRepository(GrupoArticuloEntity)
    private readonly grupoRepository: Repository<GrupoArticuloEntity>
  ) {}

  async findById(articuloId: string): Promise<Articulo | null> {
    const entity = await this.articuloRepository.findOne({
      where: { articuloId },
      relations: ['grupos', 'detalle']
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(filters?: ArticuloFilters): Promise<Articulo[]> {
    const queryBuilder = this.articuloRepository.createQueryBuilder('articulo')
      .leftJoinAndSelect('articulo.grupos', 'grupos')
      .leftJoinAndSelect('articulo.detalle', 'detalle');

    if (filters) {
      if (filters.providerId) {
        queryBuilder.andWhere('articulo.providerId = :providerId', { providerId: filters.providerId });
      }

      if (filters.grupoId) {
        queryBuilder.andWhere('grupos.grupoId = :grupoId', { grupoId: filters.grupoId });
      }

      if (filters.inStock !== undefined) {
        if (filters.inStock) {
          queryBuilder.andWhere('articulo.stock > 0');
        } else {
          queryBuilder.andWhere('(articulo.stock IS NULL OR articulo.stock <= 0)');
        }
      }

      if (filters.minPrice !== undefined) {
        queryBuilder.andWhere('articulo.precio >= :minPrice', { minPrice: filters.minPrice });
      }

      if (filters.maxPrice !== undefined) {
        queryBuilder.andWhere('articulo.precio <= :maxPrice', { maxPrice: filters.maxPrice });
      }

      if (filters.searchTerm) {
        queryBuilder.andWhere(
          '(LOWER(articulo.nombre) LIKE LOWER(:searchTerm) OR LOWER(articulo.codigo) LIKE LOWER(:searchTerm) OR LOWER(articulo.descripcion) LIKE LOWER(:searchTerm))',
          { searchTerm: `%${filters.searchTerm}%` }
        );
      }

      if (filters.limit) {
        queryBuilder.limit(filters.limit);
      }

      if (filters.offset) {
        queryBuilder.offset(filters.offset);
      }
    }

    const entities = await queryBuilder.getMany();
    return entities.map(entity => this.toDomain(entity));
  }

  async findByProviderId(providerId: string): Promise<Articulo[]> {
    const entities = await this.articuloRepository.find({
      where: { providerId },
      relations: ['grupos', 'detalle']
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async findByCodigo(codigo: string): Promise<Articulo | null> {
    const entity = await this.articuloRepository.findOne({
      where: { codigo },
      relations: ['grupos', 'detalle']
    });
    return entity ? this.toDomain(entity) : null;
  }

  async save(articulo: Articulo): Promise<Articulo> {
    const entity = await this.toEntity(articulo);
    const savedEntity = await this.articuloRepository.save(entity);
    return this.toDomain(savedEntity);
  }

  async update(articulo: Articulo): Promise<Articulo> {
    const entity = await this.toEntity(articulo);
    const updatedEntity = await this.articuloRepository.save(entity);
    return this.toDomain(updatedEntity);
  }

  async delete(articuloId: string): Promise<void> {
    await this.articuloRepository.delete({ articuloId });
  }

  async findByGrupoId(grupoId: string): Promise<Articulo[]> {
    const entities = await this.articuloRepository.find({
      where: {
        grupos: {
          grupoId: grupoId
        }
      },
      relations: ['grupos', 'detalle']
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async findByPriceRange(minPrice: number, maxPrice: number): Promise<Articulo[]> {
    const entities = await this.articuloRepository.find({
      where: {
        precio: Between(minPrice, maxPrice)
      },
      relations: ['grupos', 'detalle']
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async findInStock(): Promise<Articulo[]> {
    return this.findAll({ inStock: true });
  }

  async findOutOfStock(): Promise<Articulo[]> {
    return this.findAll({ inStock: false });
  }

  async search(term: string): Promise<Articulo[]> {
    return this.findAll({ searchTerm: term });
  }

  async associateWithGrupo(articuloId: string, grupoId: string): Promise<void> {
    const articulo = await this.articuloRepository.findOne({
      where: { articuloId },
      relations: ['grupos']
    });

    const grupo = await this.grupoRepository.findOne({
      where: { grupoId }
    });

    if (articulo && grupo) {
      if (!articulo.grupos) {
        articulo.grupos = [];
      }
      
      const alreadyAssociated = articulo.grupos.some(g => g.grupoId === grupoId);
      if (!alreadyAssociated) {
        articulo.grupos.push(grupo);
        await this.articuloRepository.save(articulo);
      }
    }
  }

  async dissociateFromGrupo(articuloId: string, grupoId: string): Promise<void> {
    const articulo = await this.articuloRepository.findOne({
      where: { articuloId },
      relations: ['grupos']
    });

    if (articulo && articulo.grupos) {
      articulo.grupos = articulo.grupos.filter(grupo => grupo.grupoId !== grupoId);
      await this.articuloRepository.save(articulo);
    }
  }

  async findGruposByArticuloId(articuloId: string): Promise<string[]> {
    const articulo = await this.articuloRepository.findOne({
      where: { articuloId },
      relations: ['grupos']
    });

    return articulo?.grupos?.map(grupo => grupo.grupoId) || [];
  }

  // Métodos de conversión
  private toDomain(entity: ArticuloEntity): Articulo {
    return new Articulo(
      entity.articuloId,
      entity.providerId,
      entity.codigo,
      entity.nombre,
      entity.descripcion,
      entity.presentacion,
      Number(entity.precio),
      entity.stock,
      entity.lastPriceUpdate,
      entity.createdAt,
      entity.updatedAt,
      entity.grupos?.map(grupo => grupo.grupoId) || []
    );
  }

  private async toEntity(articulo: Articulo): Promise<ArticuloEntity> {
    const entity = new ArticuloEntity();
    entity.articuloId = articulo.articuloId;
    entity.providerId = articulo.providerId;
    entity.codigo = articulo.codigo;
    entity.nombre = articulo.nombre;
    entity.descripcion = articulo.descripcion;
    entity.presentacion = articulo.presentacion;
    entity.precio = articulo.precio;
    entity.stock = articulo.stock;
    entity.lastPriceUpdate = articulo.lastPriceUpdate;
    entity.createdAt = articulo.createdAt;
    entity.updatedAt = articulo.updatedAt;

    // Cargar grupos si existen
    if (articulo.grupos && articulo.grupos.length > 0) {
      const grupoEntities = await this.grupoRepository.findBy({
        grupoId: In(articulo.grupos)
      });
      entity.grupos = grupoEntities;
    }

    return entity;
  }
} 