import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/api/guards/jwt-auth.guard';
import { CreateAddressDto } from './dtos/create-address.dto';
import { UpdateAddressDto } from './dtos/update-address.dto';
import { AddressService } from '@/application/services/address/address.service';

@ApiTags('Direcciones')
@Controller('v1/address')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todas las direcciones' })
  @ApiResponse({ status: 200, description: 'Lista de direcciones obtenida exitosamente' })
  async findAll() {
    return await this.addressService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una dirección por ID' })
  @ApiResponse({ status: 200, description: 'Dirección encontrada exitosamente' })
  @ApiResponse({ status: 404, description: 'Dirección no encontrada' })
  async findOne(@Param('id') id: string) {
    return await this.addressService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear una nueva dirección' })
  @ApiResponse({ status: 201, description: 'Dirección creada exitosamente' })
  async create(@Body() createAddressDto: CreateAddressDto) {
    return await this.addressService.create(createAddressDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una dirección existente' })
  @ApiResponse({ status: 200, description: 'Dirección actualizada exitosamente' })
  @ApiResponse({ status: 404, description: 'Dirección no encontrada' })
  async update(
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return await this.addressService.update(id, updateAddressDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una dirección' })
  @ApiResponse({ status: 200, description: 'Dirección eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Dirección no encontrada' })
  async remove(@Param('id') id: string) {
    return await this.addressService.remove(id);
  }
} 