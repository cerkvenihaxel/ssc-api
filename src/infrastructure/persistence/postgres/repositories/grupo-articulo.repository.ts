import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { IGrupoArticuloRepository } from '../../../../domain/repositories/articulo/grupo-articulo.repository';
import { GrupoArticulo } from '../../../../domain/entities/grupo-articulo.entity';
import { GrupoArticuloEntity } from '../entities/grupo-articulo.entity';

@Injectable()
export class PostgresGrupoArticuloRepository implements IGrupoArticuloRepository {
  constructor(
    @InjectRepository(GrupoArticuloEntity)
    private readonly grupoRepository: Repository<GrupoArticuloEntity>
  ) {}

  async findById(grupoId: string): Promise<GrupoArticulo | null> {
    const entity = await this.grupoRepository.findOne({
      where: { grupoId }
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(): Promise<GrupoArticulo[]> {
    const entities = await this.grupoRepository.find({
      order: { nombre: 'ASC' }
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async findByNombre(nombre: string): Promise<GrupoArticulo | null> {
    const entity = await this.grupoRepository.findOne({
      where: { nombre }
    });
    return entity ? this.toDomain(entity) : null;
  }

  async save(grupo: GrupoArticulo): Promise<GrupoArticulo> {
    const entity = this.toEntity(grupo);
    const savedEntity = await this.grupoRepository.save(entity);
    return this.toDomain(savedEntity);
  }

  async update(grupo: GrupoArticulo): Promise<GrupoArticulo> {
    const entity = this.toEntity(grupo);
    const updatedEntity = await this.grupoRepository.save(entity);
    return this.toDomain(updatedEntity);
  }

  async delete(grupoId: string): Promise<void> {
    await this.grupoRepository.delete({ grupoId });
  }

  async search(term: string): Promise<GrupoArticulo[]> {
    const entities = await this.grupoRepository.find({
      where: [
        { nombre: Like(`%${term}%`) },
        { descripcion: Like(`%${term}%`) }
      ],
      order: { nombre: 'ASC' }
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async findGruposWithArticles(): Promise<GrupoArticulo[]> {
    const entities = await this.grupoRepository.find({
      relations: ['articulos'],
      order: { nombre: 'ASC' }
    });
    return entities
      .filter(entity => entity.articulos && entity.articulos.length > 0)
      .map(entity => this.toDomain(entity));
  }

  async findEmptyGrupos(): Promise<GrupoArticulo[]> {
    const entities = await this.grupoRepository.find({
      relations: ['articulos'],
      order: { nombre: 'ASC' }
    });
    return entities
      .filter(entity => !entity.articulos || entity.articulos.length === 0)
      .map(entity => this.toDomain(entity));
  }

  // Métodos de conversión
  private toDomain(entity: GrupoArticuloEntity): GrupoArticulo {
    return new GrupoArticulo(
      entity.grupoId,
      entity.nombre,
      entity.descripcion,
      entity.createdAt,
      entity.updatedAt
    );
  }

  private toEntity(grupo: GrupoArticulo): GrupoArticuloEntity {
    const entity = new GrupoArticuloEntity();
    entity.grupoId = grupo.grupoId;
    entity.nombre = grupo.nombre;
    entity.descripcion = grupo.descripcion;
    entity.createdAt = grupo.createdAt;
    entity.updatedAt = grupo.updatedAt;
    return entity;
  }
} 