import { Controller, Get, Post, Put, Delete, Param, Body, HttpStatus, HttpCode, ParseUUIDPipe, ValidationPipe, UsePipes, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { GrupoArticuloService } from '../../../application/services/deposito/grupo-articulo.service';
import { GrupoArticulo } from '../../../domain/entities/grupo-articulo.entity';
import { CreateGrupoArticuloDto } from '../../../api/dtos/deposito/create-grupo-articulo.dto';
import { UpdateGrupoArticuloDto } from '../../../api/dtos/deposito/update-grupo-articulo.dto';

@ApiTags('Depósito - Grupos')
@Controller('v1/deposito/grupos')
@UsePipes(new ValidationPipe({ transform: true }))
export class GruposController {
  constructor(private readonly grupoService: GrupoArticuloService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los grupos de artículos' })
  @ApiQuery({ name: 'withArticles', required: false, type: Boolean, description: 'Filtrar solo grupos con artículos' })
  @ApiQuery({ name: 'searchTerm', required: false, description: 'Término de búsqueda' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de grupos obtenida exitosamente',
    type: [Object],
  })
  async findAllGrupos(
    @Query('withArticles') withArticles?: boolean,
    @Query('searchTerm') searchTerm?: string,
  ): Promise<GrupoArticulo[]> {
    if (searchTerm) {
      return this.grupoService.searchGrupos(searchTerm);
    }
    
    if (withArticles === true) {
      return this.grupoService.findGruposWithArticles();
    }
    
    if (withArticles === false) {
      return this.grupoService.findEmptyGrupos();
    }
    
    return this.grupoService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un grupo por ID' })
  @ApiParam({ name: 'id', description: 'ID del grupo' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Grupo obtenido exitosamente',
    type: Object,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Grupo no encontrado',
  })
  async findGrupoById(@Param('id', ParseUUIDPipe) id: string): Promise<GrupoArticulo | null> {
    return this.grupoService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo grupo de artículos' })
  @ApiBody({ type: CreateGrupoArticuloDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Grupo creado exitosamente',
    type: Object,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Ya existe un grupo con el nombre proporcionado',
  })
  async createGrupo(@Body() createGrupoDto: CreateGrupoArticuloDto): Promise<GrupoArticulo> {
    return this.grupoService.createGrupo(createGrupoDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un grupo existente' })
  @ApiParam({ name: 'id', description: 'ID del grupo' })
  @ApiBody({ type: UpdateGrupoArticuloDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Grupo actualizado exitosamente',
    type: Object,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Grupo no encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Ya existe un grupo con el nombre proporcionado',
  })
  async updateGrupo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateGrupoDto: UpdateGrupoArticuloDto
  ): Promise<GrupoArticulo> {
    return this.grupoService.updateGrupo(id, updateGrupoDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un grupo' })
  @ApiParam({ name: 'id', description: 'ID del grupo' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Grupo eliminado exitosamente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Grupo no encontrado',
  })
  async deleteGrupo(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.grupoService.deleteGrupo(id);
  }
} 