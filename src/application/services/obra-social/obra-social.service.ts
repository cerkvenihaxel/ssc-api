import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { IObraSocialRepository } from '../../../domain/repositories/obra-social/obra-social.repository';
import { ObraSocial } from '../../../domain/models/obra-social/obra-social.model';
import { CreateObraSocialDto } from '../../../api/v1/obras-sociales/dtos/create-obra-social.dto';
import { UpdateObraSocialDto } from '../../../api/v1/obras-sociales/dtos/update-obra-social.dto';

@Injectable()
export class ObraSocialService {
  constructor(
    @Inject('IObraSocialRepository')
    private readonly obraSocialRepository: IObraSocialRepository
  ) {}

  async findAll(): Promise<ObraSocial[]> {
    return this.obraSocialRepository.findAll();
  }

  async findById(healthcareProviderId: string): Promise<ObraSocial> {
    const obraSocial = await this.obraSocialRepository.findById(healthcareProviderId);
    if (!obraSocial) {
      throw new NotFoundException(`Obra Social con ID ${healthcareProviderId} no encontrada`);
    }
    return obraSocial;
  }

  async create(dto: CreateObraSocialDto): Promise<ObraSocial> {
    // Verificar si ya existe una obra social con el mismo nombre
    const existingObraSocial = await this.obraSocialRepository.findByName(dto.name);
    if (existingObraSocial) {
      throw new ConflictException(`Ya existe una obra social con el nombre ${dto.name}`);
    }

    const obraSocial = ObraSocial.create(
      dto.name,
      dto.status,
      {
        contactPhone: dto.contactPhone,
        contactEmail: dto.contactEmail,
        address: dto.address,
        createdBy: dto.createdBy
      }
    );

    return this.obraSocialRepository.save(obraSocial);
  }

  async update(healthcareProviderId: string, dto: UpdateObraSocialDto): Promise<ObraSocial> {
    const existingObraSocial = await this.findById(healthcareProviderId);

    // Verificar nombre único si se está actualizando
    if (dto.name && dto.name !== existingObraSocial.name) {
      const obraSocialWithSameName = await this.obraSocialRepository.findByName(dto.name);
      if (obraSocialWithSameName) {
        throw new ConflictException(`Ya existe una obra social con el nombre ${dto.name}`);
      }
    }

    const updatedObraSocial = new ObraSocial(
      healthcareProviderId,
      dto.name || existingObraSocial.name,
      dto.status || existingObraSocial.status,
      dto.contactPhone !== undefined ? dto.contactPhone : existingObraSocial.contactPhone,
      dto.contactEmail !== undefined ? dto.contactEmail : existingObraSocial.contactEmail,
      dto.address !== undefined ? dto.address : existingObraSocial.address,
      existingObraSocial.createdAt,
      new Date(),
      existingObraSocial.createdBy,
      dto.updatedBy || existingObraSocial.updatedBy
    );

    return this.obraSocialRepository.update(updatedObraSocial);
  }

  async delete(healthcareProviderId: string): Promise<void> {
    await this.findById(healthcareProviderId);
    await this.obraSocialRepository.delete(healthcareProviderId);
  }
} 