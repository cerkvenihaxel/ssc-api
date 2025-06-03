import { Injectable, Inject, ConflictException, NotFoundException } from '@nestjs/common';
import { GrupoArticulo } from '../../../domain/entities/grupo-articulo.entity';
import { IGrupoArticuloRepository } from '../../../domain/repositories/articulo/grupo-articulo.repository';
import { CreateGrupoArticuloDto } from '../../../api/dtos/deposito/create-grupo-articulo.dto';
import { UpdateGrupoArticuloDto } from '../../../api/dtos/deposito/update-grupo-articulo.dto';

export const GRUPO_ARTICULO_REPOSITORY_TOKEN = 'IGrupoArticuloRepository';

@Injectable()
export class GrupoArticuloService {
  constructor(
    @Inject(GRUPO_ARTICULO_REPOSITORY_TOKEN)
    private readonly grupoRepository: IGrupoArticuloRepository,
  ) {}

  async findAll(): Promise<GrupoArticulo[]> {
    return this.grupoRepository.findAll();
  }

  async findById(grupoId: string): Promise<GrupoArticulo | null> {
    return this.grupoRepository.findById(grupoId);
  }

  async createGrupo(createDto: CreateGrupoArticuloDto): Promise<GrupoArticulo> {
    // Validar que el nombre no exista
    const existingGrupo = await this.grupoRepository.findByNombre(createDto.nombre);
    if (existingGrupo) {
      throw new ConflictException(`Ya existe un grupo con el nombre: ${createDto.nombre}`);
    }

    // Crear la entidad de dominio
    const grupo = GrupoArticulo.create(createDto.nombre, {
      descripcion: createDto.descripcion
    });

    return this.grupoRepository.save(grupo);
  }

  async updateGrupo(grupoId: string, updateDto: UpdateGrupoArticuloDto): Promise<GrupoArticulo> {
    const existingGrupo = await this.findById(grupoId);
    if (!existingGrupo) {
      throw new NotFoundException(`No se encontró el grupo con ID: ${grupoId}`);
    }

    // Validar nombre único si se está actualizando
    if (updateDto.nombre && updateDto.nombre !== existingGrupo.nombre) {
      const conflictingGrupo = await this.grupoRepository.findByNombre(updateDto.nombre);
      if (conflictingGrupo) {
        throw new ConflictException(`Ya existe un grupo con el nombre: ${updateDto.nombre}`);
      }
    }

    // Crear grupo actualizado
    const updatedGrupo = existingGrupo.update(
      updateDto.nombre ?? existingGrupo.nombre,
      updateDto.descripcion !== undefined ? updateDto.descripcion : existingGrupo.descripcion
    );

    return this.grupoRepository.update(updatedGrupo);
  }

  async deleteGrupo(grupoId: string): Promise<void> {
    const existingGrupo = await this.findById(grupoId);
    if (!existingGrupo) {
      throw new NotFoundException(`No se encontró el grupo con ID: ${grupoId}`);
    }

    await this.grupoRepository.delete(grupoId);
  }

  async searchGrupos(term: string): Promise<GrupoArticulo[]> {
    return this.grupoRepository.search(term);
  }

  async findGruposWithArticles(): Promise<GrupoArticulo[]> {
    return this.grupoRepository.findGruposWithArticles();
  }

  async findEmptyGrupos(): Promise<GrupoArticulo[]> {
    return this.grupoRepository.findEmptyGrupos();
  }
} 