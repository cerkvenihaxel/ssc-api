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
  ApiBody,
} from '@nestjs/swagger';
import { ArticuloService } from '../../../application/services/deposito/articulo.service';
import { CreateArticuloDto } from '../../dtos/deposito/create-articulo.dto';
import { UpdateArticuloDto } from '../../dtos/deposito/update-articulo.dto';
import { Articulo } from '../../../domain/entities/articulo.entity'; // This line is already present
import { FindAllArticulosQueryDto } from '../../../../find-all-articulos-query.dto';

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
    type: Articulo,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada inválidos',
  })
  @ApiResponse({
    status: 409,
    description: 'Ya existe un artículo con el código proporcionado',
  })
  async createArticulo(
    @Body() createArticuloDto: CreateArticuloDto,
  ): Promise<Articulo> {
    return this.articuloService.createArticulo(createArticuloDto);
  }

  @Get('search/:term')
  @ApiOperation({ summary: 'Buscar artículos por término' })
  @ApiParam({ name: 'term', description: 'Término de búsqueda' })
  @ApiResponse({
    status: 200,
    description: 'Resultados de búsqueda obtenidos exitosamente',
    type: [Articulo],
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
    type: [Articulo],
  })
  async findArticulosByProveedor(
    @Param('providerId', ParseUUIDPipe) providerId: string,
  ): Promise<Articulo[]> {
    return this.articuloService.findAllArticulos({ providerId });
  }

  @Get('stock/disponible')
  @ApiOperation({ summary: 'Obtener artículos en stock' })
  @ApiResponse({
    status: 200,
    description: 'Artículos en stock obtenidos exitosamente',
    type: [Articulo],
  })
  async findArticulosInStock(): Promise<Articulo[]> {
    return this.articuloService.findAllArticulos({ inStock: true });
  }

  @Get('stock/agotado')
  @ApiOperation({ summary: 'Obtener artículos sin stock' })
  @ApiResponse({
    status: 200,
    description: 'Artículos sin stock obtenidos exitosamente',
    type: [Articulo],
  })
  async findArticulosOutOfStock(): Promise<Articulo[]> {
    return this.articuloService.findAllArticulos({ inStock: false });
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los artículos con filtros opcionales',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de artículos obtenida exitosamente',
    type: [Articulo],
  })
  async findAllArticulos(
    @Query() filters: FindAllArticulosQueryDto,
  ): Promise<Articulo[]> {
    console.log('Buscando artículos con filtros:', filters);

    const articulos = await this.articuloService.findAllArticulos(
      Object.keys(filters).length > 0 ? filters : undefined,
    );
    console.log('Artículos encontrados:', articulos);
    return articulos;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un artículo por ID' })
  @ApiParam({ name: 'id', description: 'ID del artículo' })
  @ApiResponse({
    status: 200,
    description: 'Artículo encontrado',
    type: Articulo,
  })
  @ApiResponse({
    status: 404,
    description: 'Artículo no encontrado',
  })
  async findArticuloById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Articulo> {
    return this.articuloService.findArticuloById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un artículo' })
  @ApiParam({ name: 'id', description: 'ID del artículo' })
  @ApiBody({ type: UpdateArticuloDto })
  @ApiResponse({
    status: 200,
    description: 'Artículo actualizado exitosamente',
    type: Articulo,
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
}
