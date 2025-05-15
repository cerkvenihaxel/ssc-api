import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Proveedor } from '../../../domain/models/proveedor/proveedor.model';
import { IProveedorRepository } from '../../../domain/repositories/proveedor/proveedor.repository';
import { CreateProveedorDto } from '../../../api/v1/proveedores/dtos/create-proveedor.dto';
import { UpdateProveedorDto } from '../../../api/v1/proveedores/dtos/update-proveedor.dto';
import { PROVEEDOR_REPOSITORY } from '../../../domain/repositories/proveedor/proveedor.repository.token';

@Injectable()
export class ProveedorService {
  constructor(
    @Inject(PROVEEDOR_REPOSITORY)
    private readonly proveedorRepository: IProveedorRepository,
  ) {}

  async findAll(): Promise<Proveedor[]> {
    return this.proveedorRepository.findAll();
  }

  async findById(providerId: string): Promise<Proveedor> {
    const proveedor = await this.proveedorRepository.findById(providerId);
    if (!proveedor) {
      throw new NotFoundException(`Proveedor with ID ${providerId} not found`);
    }
    return proveedor;
  }

  async create(createProveedorDto: CreateProveedorDto): Promise<Proveedor> {
    // Verify if provider with same CUIT already exists
    const existingProveedorByCuit = await this.proveedorRepository.findByCuit(createProveedorDto.cuit);
    if (existingProveedorByCuit) {
      throw new Error(`Provider with CUIT ${createProveedorDto.cuit} already exists`);
    }

    // Verify if provider with same name already exists
    const existingProveedorByName = await this.proveedorRepository.findByName(createProveedorDto.providerName);
    if (existingProveedorByName) {
      throw new Error(`Provider with name ${createProveedorDto.providerName} already exists`);
    }

    const proveedor = Proveedor.create(
      createProveedorDto.providerName,
      createProveedorDto.providerType,
      createProveedorDto.cuit,
      createProveedorDto.status,
      {
        contactName: createProveedorDto.contactName,
        contactPhone: createProveedorDto.contactPhone,
        contactEmail: createProveedorDto.contactEmail,
        createdBy: createProveedorDto.createdBy,
        userId: createProveedorDto.userId
      }
    );

    return this.proveedorRepository.save(proveedor);
  }

  async update(providerId: string, updateProveedorDto: UpdateProveedorDto): Promise<Proveedor> {
    const existingProveedor = await this.findById(providerId);

    if (updateProveedorDto.cuit) {
      const proveedorByCuit = await this.proveedorRepository.findByCuit(updateProveedorDto.cuit);
      if (proveedorByCuit && proveedorByCuit.providerId !== providerId) {
        throw new Error(`Provider with CUIT ${updateProveedorDto.cuit} already exists`);
      }
    }

    if (updateProveedorDto.providerName) {
      const proveedorByName = await this.proveedorRepository.findByName(updateProveedorDto.providerName);
      if (proveedorByName && proveedorByName.providerId !== providerId) {
        throw new Error(`Provider with name ${updateProveedorDto.providerName} already exists`);
      }
    }

    const updatedProveedor = Proveedor.create(
      updateProveedorDto.providerName || existingProveedor.providerName,
      updateProveedorDto.providerType || existingProveedor.providerType,
      updateProveedorDto.cuit || existingProveedor.cuit,
      updateProveedorDto.status || existingProveedor.status,
      {
        providerId: existingProveedor.providerId,
        contactName: updateProveedorDto.contactName ?? existingProveedor.contactName,
        contactPhone: updateProveedorDto.contactPhone ?? existingProveedor.contactPhone,
        contactEmail: updateProveedorDto.contactEmail ?? existingProveedor.contactEmail,
        createdBy: existingProveedor.createdBy,
        updatedBy: updateProveedorDto.updatedBy,
        userId: updateProveedorDto.userId ?? existingProveedor.userId
      }
    );

    return this.proveedorRepository.update(updatedProveedor);
  }

  async delete(providerId: string): Promise<void> {
    await this.findById(providerId); // Verify if exists
    await this.proveedorRepository.delete(providerId);
  }
} 