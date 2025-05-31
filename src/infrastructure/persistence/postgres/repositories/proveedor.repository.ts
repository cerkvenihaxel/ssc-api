import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { IProveedorRepository } from '../../../../domain/repositories/proveedor/proveedor.repository';
import { Proveedor } from '../../../../domain/models/proveedor/proveedor.model';
import { ProveedorEntity, EspecialidadEntity } from '../entities/proveedor.entity';

@Injectable()
export class PostgresProveedorRepository implements IProveedorRepository {
  constructor(
    @InjectRepository(ProveedorEntity)
    private readonly proveedorRepository: Repository<ProveedorEntity>,
  ) {}

  private toDomain(entity: ProveedorEntity): Proveedor {
    return new Proveedor(
      entity.providerId,
      entity.providerName,
      entity.providerType,
      entity.cuit,
      entity.contactName,
      entity.contactPhone,
      entity.contactEmail,
      entity.status,
      entity.creationDate,
      entity.lastUpdate,
      entity.createdBy,
      entity.updatedBy,
      entity.userId,
      entity.especialidades ? entity.especialidades.map(esp => esp.especialidadId) : []
    );
  }

  private toEntity(domain: Proveedor): ProveedorEntity {
    const entity = new ProveedorEntity();
    entity.providerId = domain.providerId;
    entity.providerName = domain.providerName;
    entity.providerType = domain.providerType;
    entity.cuit = domain.cuit;
    entity.contactName = domain.contactName;
    entity.contactPhone = domain.contactPhone;
    entity.contactEmail = domain.contactEmail;
    entity.status = domain.status;
    entity.creationDate = domain.creationDate;
    entity.lastUpdate = domain.lastUpdate;
    entity.createdBy = domain.createdBy;
    entity.updatedBy = domain.updatedBy;
    entity.userId = domain.userId;
    return entity;
  }

  async findAll(): Promise<Proveedor[]> {
    const entities = await this.proveedorRepository.find({
      relations: ['especialidades']
    });
    return entities.map(entity => this.toDomain(entity));
  }

  async findById(providerId: string): Promise<Proveedor | null> {
    const entity = await this.proveedorRepository.findOne({ 
      where: { providerId },
      relations: ['especialidades']
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByName(providerName: string): Promise<Proveedor | null> {
    const entity = await this.proveedorRepository.findOne({ 
      where: { providerName },
      relations: ['especialidades']
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCuit(cuit: string): Promise<Proveedor | null> {
    const entity = await this.proveedorRepository.findOne({ 
      where: { cuit },
      relations: ['especialidades']
    });
    return entity ? this.toDomain(entity) : null;
  }

  async save(proveedor: Proveedor): Promise<Proveedor> {
    const entity = this.toEntity(proveedor);
    
    // Si hay especialidades, cargarlas
    if (proveedor.specialties && proveedor.specialties.length > 0) {
      const especialidadEntities = await this.proveedorRepository.manager
        .getRepository(EspecialidadEntity)
        .findBy({
          especialidadId: In(proveedor.specialties)
        });
      
      entity.especialidades = especialidadEntities;
    }
    
    const savedEntity = await this.proveedorRepository.save(entity);
    return this.toDomain(savedEntity);
  }

  async update(proveedor: Proveedor): Promise<Proveedor> {
    const entity = this.toEntity(proveedor);
    
    // Si hay especialidades, cargarlas
    if (proveedor.specialties && proveedor.specialties.length > 0) {
      const especialidadEntities = await this.proveedorRepository.manager
        .getRepository(EspecialidadEntity)
        .findBy({
          especialidadId: In(proveedor.specialties)
        });
      
      entity.especialidades = especialidadEntities;
    } else {
      entity.especialidades = [];
    }
    
    const updatedEntity = await this.proveedorRepository.save(entity);
    return this.toDomain(updatedEntity);
  }

  async delete(providerId: string): Promise<void> {
    await this.proveedorRepository.delete(providerId);
  }
} 