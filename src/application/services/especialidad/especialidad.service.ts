import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { Especialidad } from '../../../domain/models/especialidad/especialidad.model';
import { IEspecialidadRepository } from '../../../domain/repositories/especialidad/especialidad.repository';
import { CreateEspecialidadDto } from '../../../api/v1/especialidades/dtos/create-especialidad.dto';
import { UpdateEspecialidadDto } from '../../../api/v1/especialidades/dtos/update-especialidad.dto';

@Injectable()
export class EspecialidadService {
  constructor(
    @Inject('IEspecialidadRepository')
    private readonly especialidadRepository: IEspecialidadRepository
  ) {}

  async findAll(): Promise<Especialidad[]> {
    return this.especialidadRepository.findAll();
  }

  async findActive(): Promise<Especialidad[]> {
    return this.especialidadRepository.findActive();
  }

  async findById(especialidadId: string): Promise<Especialidad> {
    const especialidad = await this.especialidadRepository.findById(especialidadId);
    if (!especialidad) {
      throw new NotFoundException(`Especialidad con ID ${especialidadId} no encontrada`);
    }
    return especialidad;
  }

  async create(dto: CreateEspecialidadDto): Promise<Especialidad> {
    // Verificar si ya existe una especialidad con el mismo nombre
    const existingByName = await this.especialidadRepository.findByNombre(dto.nombre);
    if (existingByName) {
      throw new ConflictException(`Ya existe una especialidad con el nombre ${dto.nombre}`);
    }

    // Verificar si ya existe una especialidad con el mismo código (si se proporciona)
    if (dto.codigo) {
      const existingByCodigo = await this.especialidadRepository.findByCodigo(dto.codigo);
      if (existingByCodigo) {
        throw new ConflictException(`Ya existe una especialidad con el código ${dto.codigo}`);
      }
    }

    const especialidad = Especialidad.create(
      dto.nombre,
      {
        descripcion: dto.descripcion,
        codigo: dto.codigo,
        activa: dto.activa
      }
    );

    return this.especialidadRepository.save(especialidad);
  }

  async update(especialidadId: string, dto: UpdateEspecialidadDto): Promise<Especialidad> {
    const existingEspecialidad = await this.findById(especialidadId);

    // Verificar nombre único si se está actualizando
    if (dto.nombre && dto.nombre !== existingEspecialidad.nombre) {
      const especialidadWithSameName = await this.especialidadRepository.findByNombre(dto.nombre);
      if (especialidadWithSameName) {
        throw new ConflictException(`Ya existe una especialidad con el nombre ${dto.nombre}`);
      }
    }

    // Verificar código único si se está actualizando
    if (dto.codigo && dto.codigo !== existingEspecialidad.codigo) {
      const especialidadWithSameCodigo = await this.especialidadRepository.findByCodigo(dto.codigo);
      if (especialidadWithSameCodigo) {
        throw new ConflictException(`Ya existe una especialidad con el código ${dto.codigo}`);
      }
    }

    const updatedEspecialidad = new Especialidad(
      especialidadId,
      dto.nombre || existingEspecialidad.nombre,
      dto.descripcion !== undefined ? dto.descripcion : existingEspecialidad.descripcion,
      dto.codigo !== undefined ? dto.codigo : existingEspecialidad.codigo,
      dto.activa !== undefined ? dto.activa : existingEspecialidad.activa,
      existingEspecialidad.createdAt,
      new Date()
    );

    return this.especialidadRepository.update(updatedEspecialidad);
  }

  async delete(especialidadId: string): Promise<void> {
    await this.findById(especialidadId);
    await this.especialidadRepository.delete(especialidadId);
  }

  async activate(especialidadId: string): Promise<Especialidad> {
    const especialidad = await this.findById(especialidadId);
    const activatedEspecialidad = especialidad.activate();
    return this.especialidadRepository.update(activatedEspecialidad);
  }

  async deactivate(especialidadId: string): Promise<Especialidad> {
    const especialidad = await this.findById(especialidadId);
    const deactivatedEspecialidad = especialidad.deactivate();
    return this.especialidadRepository.update(deactivatedEspecialidad);
  }
} 