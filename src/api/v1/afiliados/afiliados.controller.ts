import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AfiliadoService } from '../../../application/services/afiliado/afiliado.service';
import { CreateAfiliadoDto } from './dtos/create-afiliado.dto';
import { UpdateAfiliadoDto } from './dtos/update-afiliado.dto';
import { Afiliado } from '../../../domain/models/afiliado/afiliado.model';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@ApiTags('Afiliados')
@Controller('v1/afiliados')
export class AfiliadosController {
  constructor(private readonly afiliadoService: AfiliadoService) {}

  @ApiOperation({ summary: 'Obtener todos los afiliados (endpoint temporal sin autenticación)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de afiliados',
    type: Afiliado,
    isArray: true
  })
  @Get('test')
  async findAllTest(): Promise<Afiliado[]> {
    return this.afiliadoService.findAll();
  }

  @ApiOperation({ summary: 'Obtener un afiliado por ID (endpoint temporal sin autenticación)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Afiliado encontrado',
    type: Afiliado
  })
  @ApiResponse({ status: 404, description: 'Afiliado no encontrado' })
  @Get('test/:id')
  async findByIdTest(@Param('id') id: string): Promise<Afiliado> {
    return this.afiliadoService.findById(id);
  }

  @ApiOperation({ summary: 'Obtener todos los afiliados' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de afiliados',
    type: Afiliado,
    isArray: true
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT no válido o no proporcionado' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(): Promise<Afiliado[]> {
    return this.afiliadoService.findAll();
  }

  @ApiOperation({ summary: 'Obtener un afiliado por ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Afiliado encontrado',
    type: Afiliado
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT no válido o no proporcionado' })
  @ApiResponse({ status: 404, description: 'Afiliado no encontrado' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findById(@Param('id') id: string): Promise<Afiliado> {
    return this.afiliadoService.findById(id);
  }

  @ApiOperation({ summary: 'Crear un nuevo afiliado' })
  @ApiResponse({ 
    status: 201, 
    description: 'Afiliado creado exitosamente',
    type: Afiliado
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT no válido o no proporcionado' })
  @ApiResponse({ status: 409, description: 'Conflicto - Email, CUIL o número de afiliado ya existe' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateAfiliadoDto, @Request() req: any): Promise<Afiliado> {
    const createdBy = req.user?.userId;
    return this.afiliadoService.create(dto, createdBy);
  }

  @ApiOperation({ summary: 'Actualizar un afiliado existente' })
  @ApiResponse({ 
    status: 200, 
    description: 'Afiliado actualizado exitosamente',
    type: Afiliado
  })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT no válido o no proporcionado' })
  @ApiResponse({ status: 404, description: 'Afiliado no encontrado' })
  @ApiResponse({ status: 409, description: 'Conflicto - Email, CUIL o número de afiliado ya existe' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAfiliadoDto,
    @Request() req: any
  ): Promise<Afiliado> {
    const updatedBy = req.user?.userId;
    return this.afiliadoService.update(id, dto, updatedBy);
  }

  @ApiOperation({ summary: 'Eliminar un afiliado' })
  @ApiResponse({ status: 200, description: 'Afiliado eliminado exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado - Token JWT no válido o no proporcionado' })
  @ApiResponse({ status: 404, description: 'Afiliado no encontrado' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    await this.afiliadoService.delete(id);
  }
} 