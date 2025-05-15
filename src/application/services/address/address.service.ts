import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from '../../../domain/entities/address.entity';
import { CreateAddressDto } from '../../../api/v1/address/dtos/create-address.dto';
import { UpdateAddressDto } from '../../../api/v1/address/dtos/update-address.dto';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}

  async findAll(): Promise<Address[]> {
    return await this.addressRepository.find();
  }

  async findOne(id: string): Promise<Address> {
    const address = await this.addressRepository.findOne({ where: { id } });
    if (!address) {
      throw new NotFoundException(`Dirección con ID ${id} no encontrada`);
    }
    return address;
  }

  async create(createAddressDto: CreateAddressDto): Promise<Address> {
    const address = this.addressRepository.create({
      ...createAddressDto
    });
    return await this.addressRepository.save(address);
  }

  async update(id: string, updateAddressDto: UpdateAddressDto): Promise<Address> {
    const address = await this.findOne(id);
    const updatedAddress = Object.assign(address, updateAddressDto);
    return await this.addressRepository.save(updatedAddress);
  }

  async remove(id: string): Promise<void> {
    const address = await this.findOne(id);
    await this.addressRepository.remove(address);
  }
} 