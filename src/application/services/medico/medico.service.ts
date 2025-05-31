import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { Medico } from '../../../domain/models/medico/medico.model';
import { IMedicoRepository } from '../../../domain/repositories/medico/medico.repository';
import { CreateMedicoDto } from '../../../api/v1/medicos/dtos/create-medico.dto';
import { UpdateMedicoDto } from '../../../api/v1/medicos/dtos/update-medico.dto';
import { Pool } from 'pg';

@Injectable()
export class MedicoService {
  constructor(
    @Inject('IMedicoRepository')
    private readonly medicoRepository: IMedicoRepository,
    private readonly pool: Pool
  ) {}

  async findAll(): Promise<Medico[]> {
    return this.medicoRepository.findAll();
  }

  async findById(medicoId: string): Promise<Medico> {
    const medico = await this.medicoRepository.findById(medicoId);
    if (!medico) {
      throw new NotFoundException(`Médico con ID ${medicoId} no encontrado`);
    }
    return medico;
  }

  async findByEspecialidad(especialidadId: string): Promise<Medico[]> {
    return this.medicoRepository.findByEspecialidad(especialidadId);
  }

  async findByObraSocial(obraSocialId: string): Promise<Medico[]> {
    return this.medicoRepository.findByObraSocial(obraSocialId);
  }

  async create(dto: CreateMedicoDto): Promise<Medico> {
    // Verificar si ya existe un médico con la misma matrícula
    const existingByMatricula = await this.medicoRepository.findByMatricula(dto.matricula);
    if (existingByMatricula) {
      throw new ConflictException(`Ya existe un médico con la matrícula ${dto.matricula}`);
    }

    // Verificar si ya existe un médico con el mismo email
    const existingByEmail = await this.medicoRepository.findByEmail(dto.email);
    if (existingByEmail) {
      throw new ConflictException(`Ya existe un médico con el email ${dto.email}`);
    }

    // Verificar si existe un usuario con ese email
    const existingUser = await this.pool.query(
      'SELECT user_id FROM usuarios WHERE LOWER(email) = LOWER($1)',
      [dto.email]
    );

    let userId: string | undefined;

    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].user_id;
    } else {
      // Crear nuevo usuario con rol de Médico
      const medicoRoleResult = await this.pool.query(
        "SELECT role_id FROM roles WHERE role_name = 'Médico'"
      );

      if (medicoRoleResult.rows.length === 0) {
        throw new Error('Rol de Médico no encontrado en el sistema');
      }

      const newUserResult = await this.pool.query(
        `INSERT INTO usuarios (email, nombre, role_id, status, created_by) 
         VALUES ($1, $2, $3, 'active', $4) RETURNING user_id`,
        [dto.email, `${dto.firstName} ${dto.lastName}`, medicoRoleResult.rows[0].role_id, dto.createdBy]
      );

      userId = newUserResult.rows[0].user_id;
    }

    const medico = Medico.create(
      dto.matricula,
      dto.especialidadId,
      dto.firstName,
      dto.lastName,
      dto.email,
      {
        phone: dto.phone,
        picture: dto.picture,
        userId: userId,
        createdBy: dto.createdBy
      }
    );

    const savedMedico = await this.medicoRepository.save(medico);

    // Asociar con obras sociales si se proporcionaron
    if (dto.obrasSociales && dto.obrasSociales.length > 0) {
      for (const obraSocialId of dto.obrasSociales) {
        await this.medicoRepository.associateWithObraSocial(savedMedico.medicoId, obraSocialId);
      }
    }

    return savedMedico;
  }

  async update(medicoId: string, dto: UpdateMedicoDto): Promise<Medico> {
    const existingMedico = await this.findById(medicoId);

    // Verificar matrícula única si se está actualizando
    if (dto.matricula && dto.matricula !== existingMedico.matricula) {
      const medicoWithSameMatricula = await this.medicoRepository.findByMatricula(dto.matricula);
      if (medicoWithSameMatricula) {
        throw new ConflictException(`Ya existe un médico con la matrícula ${dto.matricula}`);
      }
    }

    // Verificar email único si se está actualizando
    if (dto.email && dto.email !== existingMedico.email) {
      const medicoWithSameEmail = await this.medicoRepository.findByEmail(dto.email);
      if (medicoWithSameEmail) {
        throw new ConflictException(`Ya existe un médico con el email ${dto.email}`);
      }

      // Si se actualiza el email, también hay que actualizar el usuario asociado
      if (existingMedico.userId) {
        await this.pool.query(
          'UPDATE usuarios SET email = $1, nombre = $2, updated_by = $3, updated_at = CURRENT_TIMESTAMP WHERE user_id = $4',
          [dto.email, `${dto.firstName || existingMedico.firstName} ${dto.lastName || existingMedico.lastName}`, dto.updatedBy, existingMedico.userId]
        );
      }
    }

    const updatedMedico = new Medico(
      medicoId,
      dto.matricula || existingMedico.matricula,
      dto.especialidadId || existingMedico.especialidadId,
      dto.firstName || existingMedico.firstName,
      dto.lastName || existingMedico.lastName,
      dto.email || existingMedico.email,
      dto.phone !== undefined ? dto.phone : existingMedico.phone,
      dto.picture !== undefined ? dto.picture : existingMedico.picture,
      existingMedico.userId,
      existingMedico.creationDate,
      new Date(),
      existingMedico.createdBy,
      dto.updatedBy || existingMedico.updatedBy
    );

    return this.medicoRepository.update(updatedMedico);
  }

  async delete(medicoId: string): Promise<void> {
    await this.findById(medicoId);
    await this.medicoRepository.delete(medicoId);
  }

  async associateWithObraSocial(medicoId: string, obraSocialId: string): Promise<void> {
    await this.findById(medicoId);
    await this.medicoRepository.associateWithObraSocial(medicoId, obraSocialId);
  }

  async dissociateFromObraSocial(medicoId: string, obraSocialId: string): Promise<void> {
    await this.findById(medicoId);
    await this.medicoRepository.dissociateFromObraSocial(medicoId, obraSocialId);
  }

  async getObrasSocialesAssociated(medicoId: string): Promise<string[]> {
    await this.findById(medicoId);
    return this.medicoRepository.getObrasSocialesAssociated(medicoId);
  }
} 