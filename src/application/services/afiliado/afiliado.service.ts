import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { IAfiliadoRepository } from '../../../domain/repositories/afiliado/afiliado.repository';
import { Afiliado } from '../../../domain/models/afiliado/afiliado.model';
import { CreateAfiliadoDto } from '../../../api/v1/afiliados/dtos/create-afiliado.dto';
import { UpdateAfiliadoDto } from '../../../api/v1/afiliados/dtos/update-afiliado.dto';
import * as bcrypt from 'bcrypt';

// UUID especial para representar acciones del sistema
const SYSTEM_UUID = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class AfiliadoService {
  constructor(
    @Inject('IAfiliadoRepository')
    private readonly afiliadoRepository: IAfiliadoRepository
  ) {}

  async findAll(): Promise<Afiliado[]> {
    return this.afiliadoRepository.findAll();
  }

  async findById(affiliateId: string): Promise<Afiliado> {
    const afiliado = await this.afiliadoRepository.findById(affiliateId);
    if (!afiliado) {
      throw new NotFoundException(`Afiliado con ID ${affiliateId} no encontrado`);
    }
    return afiliado;
  }

  async create(dto: CreateAfiliadoDto, createdBy: string): Promise<Afiliado> {
    // Verificar si ya existe un afiliado con el mismo email
    const existingEmail = await this.afiliadoRepository.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictException(`Ya existe un afiliado con el email ${dto.email}`);
    }

    // Verificar si ya existe un afiliado con el mismo CUIL
    const existingCuil = await this.afiliadoRepository.findByCuil(dto.cuil);
    if (existingCuil) {
      throw new ConflictException(`Ya existe un afiliado con el CUIL ${dto.cuil}`);
    }

    // Verificar si ya existe un afiliado con el mismo número de afiliado
    const existingNumber = await this.afiliadoRepository.findByAffiliateNumber(dto.affiliateNumber);
    if (existingNumber) {
      throw new ConflictException(`Ya existe un afiliado con el número ${dto.affiliateNumber}`);
    }

    // Hashear la contraseña
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const afiliado = Afiliado.create({
      street: '',  // Estos campos son requeridos por el nuevo método create
      afiliadoId: undefined,  // Se generará uno nuevo
      addresses: []  // Sin direcciones inicialmente
    });

    // Actualizamos los campos con los valores del DTO
    const updatedAfiliado = new Afiliado(
      afiliado.id,
      dto.affiliateNumber,
      dto.affiliateStatus,
      afiliado.creationDate,
      afiliado.lastUpdate,
      dto.cuil,
      dto.cvu || null,
      dto.documentType || 'DNI',
      dto.documentNumber,
      dto.documentCountry || 'Argentina',
      dto.gender || '',
      dto.firstName,
      dto.lastName,
      dto.birthDate || new Date(),
      dto.nationality || 'Argentina',
      dto.email,
      passwordHash,
      dto.occupation || null,
      dto.phone || null,
      dto.picture || null,
      null,  // signedTycVersion
      null,  // signedTycDate
      dto.primaryAddressId || null,
      createdBy || SYSTEM_UUID,  // createdBy - UUID del usuario logueado o sistema
      null  // updatedBy
    );

    const savedAfiliado = await this.afiliadoRepository.save(updatedAfiliado);

    // Asociar con obras sociales si se proporcionaron
    if (dto.healthcareProviderIds && dto.healthcareProviderIds.length > 0) {
      for (const healthcareProviderId of dto.healthcareProviderIds) {
        await this.afiliadoRepository.associateWithHealthcareProvider(savedAfiliado.id, healthcareProviderId);
      }
    }

    return savedAfiliado;
  }

  async update(affiliateId: string, dto: UpdateAfiliadoDto, updatedBy: string): Promise<Afiliado> {
    const existingAfiliado = await this.findById(affiliateId);

    // Verificar email único si se está actualizando
    if (dto.email && dto.email !== existingAfiliado.email) {
      const existingEmail = await this.afiliadoRepository.findByEmail(dto.email);
      if (existingEmail) {
        throw new ConflictException(`Ya existe un afiliado con el email ${dto.email}`);
      }
    }

    // Verificar CUIL único si se está actualizando
    if (dto.cuil && dto.cuil !== existingAfiliado.cuil) {
      const existingCuil = await this.afiliadoRepository.findByCuil(dto.cuil);
      if (existingCuil) {
        throw new ConflictException(`Ya existe un afiliado con el CUIL ${dto.cuil}`);
      }
    }

    // Verificar número de afiliado único si se está actualizando
    if (dto.affiliateNumber && dto.affiliateNumber !== existingAfiliado.affiliateNumber) {
      const existingNumber = await this.afiliadoRepository.findByAffiliateNumber(dto.affiliateNumber);
      if (existingNumber) {
        throw new ConflictException(`Ya existe un afiliado con el número ${dto.affiliateNumber}`);
      }
    }

    // Hashear la contraseña si se está actualizando
    let passwordHash = existingAfiliado.passwordHash;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const updatedAfiliado = new Afiliado(
      affiliateId,
      dto.affiliateNumber || existingAfiliado.affiliateNumber,
      dto.affiliateStatus || existingAfiliado.affiliateStatus,
      existingAfiliado.creationDate,
      new Date(),
      dto.cuil || existingAfiliado.cuil,
      dto.cvu !== undefined ? dto.cvu : existingAfiliado.cvu,
      dto.documentType !== undefined ? dto.documentType : existingAfiliado.documentType,
      dto.documentNumber || existingAfiliado.documentNumber,
      dto.documentCountry || existingAfiliado.documentCountry,
      dto.gender !== undefined ? dto.gender : existingAfiliado.gender,
      dto.firstName || existingAfiliado.firstName,
      dto.lastName || existingAfiliado.lastName,
      dto.birthDate || existingAfiliado.birthDate,
      dto.nationality !== undefined ? dto.nationality : existingAfiliado.nationality,
      dto.email || existingAfiliado.email,
      passwordHash,
      dto.occupation !== undefined ? dto.occupation : existingAfiliado.occupation,
      dto.phone !== undefined ? dto.phone : existingAfiliado.phone,
      dto.picture !== undefined ? dto.picture : existingAfiliado.picture,
      existingAfiliado.signedTycVersion,
      existingAfiliado.signedTycDate,
      dto.primaryAddressId !== undefined ? dto.primaryAddressId : existingAfiliado.primaryAddressId,
      existingAfiliado.createdBy,
      updatedBy || SYSTEM_UUID  // updatedBy - UUID del usuario logueado o sistema
    );

    const savedAfiliado = await this.afiliadoRepository.update(updatedAfiliado);

    // Actualizar asociaciones con obras sociales si se proporcionaron
    if (dto.healthcareProviderIds !== undefined) {
      // Obtener las obras sociales actualmente asociadas
      const currentHealthcareProviderIds = await this.afiliadoRepository.getHealthcareProvidersAssociated(affiliateId);

      // Desasociar obras sociales que ya no están seleccionadas
      for (const currentId of currentHealthcareProviderIds) {
        if (!dto.healthcareProviderIds.includes(currentId)) {
          await this.afiliadoRepository.dissociateFromHealthcareProvider(affiliateId, currentId);
        }
      }

      // Asociar nuevas obras sociales
      for (const healthcareProviderId of dto.healthcareProviderIds) {
        if (!currentHealthcareProviderIds.includes(healthcareProviderId)) {
          await this.afiliadoRepository.associateWithHealthcareProvider(affiliateId, healthcareProviderId);
        }
      }
    }

    return savedAfiliado;
  }

  async delete(affiliateId: string): Promise<void> {
    await this.findById(affiliateId);
    await this.afiliadoRepository.delete(affiliateId);
  }
} 