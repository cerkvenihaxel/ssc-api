import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { IPermisoRepository } from '../../../domain/repositories/permiso/permiso.repository';
import { Permiso } from '../../../domain/models/permiso/permiso.model';
import { CreatePermisoDto } from '../../../api/v1/permisos/dtos/create-permiso.dto';
import { UpdatePermisoDto } from '../../../api/v1/permisos/dtos/update-permiso.dto';

@Injectable()
export class PermisoService {
  constructor(
    @Inject('IPermisoRepository')
    private readonly permisoRepository: IPermisoRepository
  ) {}

  async findAll(): Promise<Permiso[]> {
    return this.permisoRepository.findAll();
  }

  async findById(permisoId: number): Promise<Permiso> {
    const permiso = await this.permisoRepository.findById(permisoId);
    if (!permiso) {
      throw new NotFoundException(`Permiso con ID ${permisoId} no encontrado`);
    }
    return permiso;
  }

  async create(dto: CreatePermisoDto): Promise<Permiso> {
    const existingPermiso = await this.permisoRepository.findByNombre(dto.nombre);
    if (existingPermiso) {
      throw new ConflictException(`Ya existe un permiso con el nombre ${dto.nombre}`);
    }

    const permiso = Permiso.create(
      dto.nombre,
      dto.descripcion
    );

    return this.permisoRepository.save(permiso);
  }

  async update(permisoId: number, dto: UpdatePermisoDto): Promise<Permiso> {
    const existingPermiso = await this.findById(permisoId);

    if (dto.nombre && dto.nombre !== existingPermiso.nombre) {
      const permisoWithSameName = await this.permisoRepository.findByNombre(dto.nombre);
      if (permisoWithSameName) {
        throw new ConflictException(`Ya existe un permiso con el nombre ${dto.nombre}`);
      }
    }

    const updatedPermiso = new Permiso(
      permisoId,
      dto.nombre || existingPermiso.nombre,
      dto.descripcion !== undefined ? dto.descripcion : existingPermiso.descripcion
    );

    return this.permisoRepository.update(updatedPermiso);
  }

  async delete(permisoId: number): Promise<void> {
    await this.findById(permisoId);
    await this.permisoRepository.delete(permisoId);
  }
} 