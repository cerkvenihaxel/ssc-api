import { Controller, Get, Post, Put, Delete, Body, Param, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/api/guards/jwt-auth.guard';
import { ProveedorService } from '../../../application/services/proveedor/proveedor.service';
import { CreateProveedorDto } from './dtos/create-proveedor.dto';
import { UpdateProveedorDto } from './dtos/update-proveedor.dto';
import { Proveedor } from '../../../domain/models/proveedor/proveedor.model';

@ApiTags('proveedores')
@Controller('v1/proveedores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ProveedorController {
  constructor(private readonly proveedorService: ProveedorService) {}

  @Get()
  @ApiOperation({ summary: 'Get all providers' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of all providers',
    type: Proveedor,
    isArray: true,
  })
  async findAll(): Promise<Proveedor[]> {
    return this.proveedorService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a provider by ID' })
  @ApiParam({ name: 'id', description: 'Provider ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The provider has been found',
    type: Proveedor,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Provider not found',
  })
  async findById(@Param('id') id: string): Promise<Proveedor> {
    return this.proveedorService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new provider' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The provider has been successfully created',
    type: Proveedor,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(@Body() createProveedorDto: CreateProveedorDto): Promise<Proveedor> {
    return this.proveedorService.create(createProveedorDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a provider' })
  @ApiParam({ name: 'id', description: 'Provider ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The provider has been successfully updated',
    type: Proveedor,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Provider not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async update(
    @Param('id') id: string,
    @Body() updateProveedorDto: UpdateProveedorDto,
  ): Promise<Proveedor> {
    return this.proveedorService.update(id, updateProveedorDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a provider' })
  @ApiParam({ name: 'id', description: 'Provider ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The provider has been successfully deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Provider not found',
  })
  async delete(@Param('id') id: string): Promise<void> {
    await this.proveedorService.delete(id);
  }
} 