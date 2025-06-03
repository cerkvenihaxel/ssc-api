import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { ArticuloService } from '../../../application/services/deposito/articulo.service';
import { CreateArticuloDto } from '../../dtos/deposito/create-articulo.dto';
import { UpdateArticuloDto } from '../../dtos/deposito/update-articulo.dto';
import { Articulo } from '../../../domain/entities/articulo.entity';

@ApiTags('Depósito - Artículos')
@Controller('v1/deposito/articulos')
@UsePipes(new ValidationPipe({ transform: true }))
export class ArticulosController {
  constructor(private readonly articuloService: ArticuloService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo artículo' })
  @ApiBody({ type: CreateArticuloDto })
  @ApiResponse({
    status: 201,
    description: 'Artículo creado exitosamente',
    type: Object,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un artículo con el código proporcionado',
  })
  async createArticulo(@Body() createArticuloDto: CreateArticuloDto): Promise<Articulo> {
    return this.articuloService.createArticulo(createArticuloDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los artículos con filtros opcionales' })
  @ApiQuery({ name: 'providerId', required: false, description: 'ID del proveedor' })
  @ApiQuery({ name: 'grupoId', required: false, description: 'ID del grupo' })
  @ApiQuery({ name: 'inStock', required: false, type: Boolean, description: 'Filtrar por artículos en stock' })
  @ApiQuery({ name: 'minPrice', required: false, type: Number, description: 'Precio mínimo' })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number, description: 'Precio máximo' })
  @ApiQuery({ name: 'searchTerm', required: false, description: 'Término de búsqueda' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Límite de resultados' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Offset para paginación' })
  @ApiResponse({
    status: 200,
    description: 'Lista de artículos obtenida exitosamente',
    type: [Object],
  })
  async findAllArticulos(
    @Query('providerId') providerId?: string,
    @Query('grupoId') grupoId?: string,
    @Query('inStock') inStock?: boolean,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('searchTerm') searchTerm?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<Articulo[]> {
    const filters = {
      providerId,
      grupoId,
      inStock,
      minPrice,
      maxPrice,
      searchTerm,
      limit,
      offset,
    };

    // Remover propiedades undefined
    Object.keys(filters).forEach(key => 
      filters[key] === undefined && delete filters[key]
    );

    return this.articuloService.findAllArticulos(Object.keys(filters).length > 0 ? filters : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un artículo por ID' })
  @ApiParam({ name: 'id', description: 'ID del artículo' })
  @ApiResponse({
    status: 200,
    description: 'Artículo encontrado',
    type: Object,
  })
  @ApiResponse({
    status: 404,
    description: 'Artículo no encontrado',
  })
  async findArticuloById(@Param('id', ParseUUIDPipe) id: string): Promise<Articulo> {
    return this.articuloService.findArticuloById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un artículo' })
  @ApiParam({ name: 'id', description: 'ID del artículo' })
  @ApiBody({ type: UpdateArticuloDto })
  @ApiResponse({
    status: 200,
    description: 'Artículo actualizado exitosamente',
    type: Object,
  })
  @ApiResponse({
    status: 404,
    description: 'Artículo no encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflicto con código existente',
  })
  async updateArticulo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateArticuloDto: UpdateArticuloDto,
  ): Promise<Articulo> {
    return this.articuloService.updateArticulo(id, updateArticuloDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un artículo' })
  @ApiParam({ name: 'id', description: 'ID del artículo' })
  @ApiResponse({
    status: 204,
    description: 'Artículo eliminado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Artículo no encontrado',
  })
  async deleteArticulo(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.articuloService.deleteArticulo(id);
  }

  @Get('search/:term')
  @ApiOperation({ summary: 'Buscar artículos por término' })
  @ApiParam({ name: 'term', description: 'Término de búsqueda' })
  @ApiResponse({
    status: 200,
    description: 'Resultados de búsqueda obtenidos exitosamente',
    type: [Object],
  })
  @ApiResponse({
    status: 400,
    description: 'Término de búsqueda inválido',
  })
  async searchArticulos(@Param('term') term: string): Promise<Articulo[]> {
    return this.articuloService.searchArticulos(term);
  }

  @Get('proveedor/:providerId')
  @ApiOperation({ summary: 'Obtener artículos por proveedor' })
  @ApiParam({ name: 'providerId', description: 'ID del proveedor' })
  @ApiResponse({
    status: 200,
    description: 'Artículos del proveedor obtenidos exitosamente',
    type: [Object],
  })
  async findArticulosByProveedor(@Param('providerId', ParseUUIDPipe) providerId: string): Promise<Articulo[]> {
    return this.articuloService.findAllArticulos({ providerId });
  }

  @Get('stock/disponible')
  @ApiOperation({ summary: 'Obtener artículos en stock' })
  @ApiResponse({
    status: 200,
    description: 'Artículos en stock obtenidos exitosamente',
    type: [Object],
  })
  async findArticulosInStock(): Promise<Articulo[]> {
    return this.articuloService.findAllArticulos({ inStock: true });
  }

  @Get('stock/agotado')
  @ApiOperation({ summary: 'Obtener artículos sin stock' })
  @ApiResponse({
    status: 200,
    description: 'Artículos sin stock obtenidos exitosamente',
    type: [Object],
  })
  async findArticulosOutOfStock(): Promise<Articulo[]> {
    return this.articuloService.findAllArticulos({ inStock: false });
  }
} 