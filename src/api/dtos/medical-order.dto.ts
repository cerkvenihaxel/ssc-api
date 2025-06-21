import { IsString, IsUUID, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsArray, ValidateNested, Min, Max, IsBoolean, IsDateString, IsDecimal } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum RequesterType {
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  AUDITOR = 'auditor'
}

export enum ItemType {
  MEDICATION = 'medication',
  EQUIPMENT = 'equipment',
  SUPPLY = 'supply'
}

export enum UrgencyLevel {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  URGENT = 4,
  CRITICAL = 5
}

export enum AuthorizationType {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic',
  HYBRID = 'hybrid'
}

export class CreateMedicalOrderItemDto {
  @ApiProperty({ description: 'ID de la categoría médica' })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ description: 'Tipo de artículo', enum: ItemType })
  @IsEnum(ItemType)
  itemType: ItemType;

  @ApiProperty({ description: 'Nombre del artículo' })
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @ApiPropertyOptional({ description: 'Código del artículo' })
  @IsOptional()
  @IsString()
  itemCode?: string;

  @ApiPropertyOptional({ description: 'Descripción del artículo' })
  @IsOptional()
  @IsString()
  itemDescription?: string;

  @ApiProperty({ description: 'Cantidad solicitada', minimum: 1 })
  @IsNumber()
  @Min(1)
  requestedQuantity: number;

  @ApiProperty({ description: 'Unidad de medida' })
  @IsString()
  @IsNotEmpty()
  unitOfMeasure: string;

  @ApiPropertyOptional({ description: 'Marca del producto' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ description: 'Presentación del producto' })
  @IsOptional()
  @IsString()
  presentation?: string;

  @ApiPropertyOptional({ description: 'Concentración del medicamento' })
  @IsOptional()
  @IsString()
  concentration?: string;

  @ApiPropertyOptional({ description: 'Vía de administración' })
  @IsOptional()
  @IsString()
  administrationRoute?: string;

  @ApiPropertyOptional({ description: 'Justificación médica específica del item' })
  @IsOptional()
  @IsString()
  medicalJustification?: string;

  @ApiPropertyOptional({ description: 'Costo unitario estimado' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimatedUnitCost?: number;
}

export class CreateMedicalOrderDto {
  @ApiProperty({ description: 'ID del afiliado beneficiario' })
  @IsUUID()
  @IsNotEmpty()
  affiliateId: string;

  @ApiPropertyOptional({ description: 'ID de la obra social' })
  @IsOptional()
  @IsUUID()
  healthcareProviderId?: string;

  @ApiProperty({ description: 'Nivel de urgencia', enum: UrgencyLevel })
  @IsEnum(UrgencyLevel)
  urgencyId: UrgencyLevel;

  @ApiProperty({ description: 'Título del pedido' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Descripción detallada del pedido' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Justificación médica del pedido' })
  @IsString()
  @IsNotEmpty()
  medicalJustification: string;

  @ApiPropertyOptional({ description: 'Diagnóstico médico' })
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiPropertyOptional({ description: 'Plan de tratamiento' })
  @IsOptional()
  @IsString()
  treatmentPlan?: string;

  @ApiPropertyOptional({ description: 'Duración estimada del tratamiento en días' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  estimatedDurationDays?: number;

  @ApiProperty({ description: 'Items del pedido médico', type: [CreateMedicalOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMedicalOrderItemDto)
  items: CreateMedicalOrderItemDto[];

  @ApiPropertyOptional({ description: 'Indica si el pedido tiene archivos adjuntos' })
  @IsOptional()
  @IsBoolean()
  hasAttachments?: boolean;

  @ApiPropertyOptional({ description: 'Costo total estimado' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimatedCost?: number;

  @ApiPropertyOptional({ description: 'Tipo de autorización preferida', enum: AuthorizationType })
  @IsOptional()
  @IsEnum(AuthorizationType)
  authorizationType?: AuthorizationType;
}

export class UpdateMedicalOrderDto {
  @ApiPropertyOptional({ description: 'Título del pedido' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiPropertyOptional({ description: 'Descripción detallada del pedido' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Justificación médica del pedido' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  medicalJustification?: string;

  @ApiPropertyOptional({ description: 'Diagnóstico médico' })
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiPropertyOptional({ description: 'Plan de tratamiento' })
  @IsOptional()
  @IsString()
  treatmentPlan?: string;

  @ApiPropertyOptional({ description: 'Duración estimada del tratamiento en días' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  estimatedDurationDays?: number;

  @ApiPropertyOptional({ description: 'Nivel de urgencia', enum: UrgencyLevel })
  @IsOptional()
  @IsEnum(UrgencyLevel)
  urgencyId?: UrgencyLevel;

  @ApiPropertyOptional({ description: 'Items del pedido médico', type: [CreateMedicalOrderItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMedicalOrderItemDto)
  items?: CreateMedicalOrderItemDto[];

  @ApiPropertyOptional({ description: 'Costo total estimado' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimatedCost?: number;
}

export class AuthorizeOrderDto {
  @ApiProperty({ description: 'Decisión de autorización' })
  @IsEnum(['approved', 'rejected', 'partial'])
  decision: 'approved' | 'rejected' | 'partial';

  @ApiPropertyOptional({ description: 'Notas de autorización' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Razón de rechazo (requerida si decision = rejected)' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiPropertyOptional({ description: 'Aprobaciones específicas por item (para decisión partial)' })
  @IsOptional()
  @IsArray()
  itemApprovals?: {
    itemId: string;
    approved: boolean;
    approvedQuantity?: number;
    rejectionReason?: string;
  }[];
}

export class MedicalOrderQueryDto {
  @ApiPropertyOptional({ description: 'Número de página', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Elementos por página', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Filtrar por estado de autorización' })
  @IsOptional()
  @IsString()
  authorizationStatus?: string;

  @ApiPropertyOptional({ description: 'Filtrar por tipo de solicitante' })
  @IsOptional()
  @IsEnum(RequesterType)
  requesterType?: RequesterType;

  @ApiPropertyOptional({ description: 'Filtrar por nivel de urgencia' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  urgencyId?: number;

  @ApiPropertyOptional({ description: 'Filtrar por ID de afiliado' })
  @IsOptional()
  @IsUUID()
  affiliateId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por ID de solicitante' })
  @IsOptional()
  @IsUUID()
  requesterId?: string;

  @ApiPropertyOptional({ description: 'Fecha desde (ISO string)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Fecha hasta (ISO string)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Búsqueda por texto en título, descripción o número de pedido' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Ordenar por campo' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Dirección de ordenamiento' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}

export class MedicalOrderResponseDto {
  @ApiProperty({ description: 'ID del pedido' })
  orderId: string;

  @ApiProperty({ description: 'Número de pedido' })
  orderNumber: string;

  @ApiProperty({ description: 'ID del solicitante' })
  requesterId: string;

  @ApiProperty({ description: 'Tipo de solicitante' })
  requesterType: RequesterType;

  @ApiProperty({ description: 'Nombre del solicitante' })
  requesterName: string;

  @ApiProperty({ description: 'ID del afiliado' })
  affiliateId: string;

  @ApiProperty({ description: 'Nombre completo del afiliado' })
  affiliateName: string;

  @ApiProperty({ description: 'Número de afiliado' })
  affiliateNumber: string;

  @ApiPropertyOptional({ description: 'Nombre de la obra social' })
  healthcareProviderName?: string;

  @ApiProperty({ description: 'Estado del pedido' })
  state: {
    id: number;
    name: string;
    description: string;
    isFinal: boolean;
  };

  @ApiProperty({ description: 'Urgencia del pedido' })
  urgency: {
    id: number;
    name: string;
    description: string;
    priorityLevel: number;
    colorCode: string;
  };

  @ApiProperty({ description: 'Título del pedido' })
  title: string;

  @ApiProperty({ description: 'Descripción del pedido' })
  description?: string;

  @ApiProperty({ description: 'Justificación médica' })
  medicalJustification: string;

  @ApiProperty({ description: 'Diagnóstico' })
  diagnosis?: string;

  @ApiProperty({ description: 'Plan de tratamiento' })
  treatmentPlan?: string;

  @ApiProperty({ description: 'Duración estimada en días' })
  estimatedDurationDays?: number;

  @ApiProperty({ description: 'Items del pedido' })
  items: {
    itemId: string;
    categoryId: string;
    categoryName: string;
    itemType: ItemType;
    itemName: string;
    itemCode?: string;
    itemDescription?: string;
    requestedQuantity: number;
    approvedQuantity?: number;
    unitOfMeasure: string;
    brand?: string;
    presentation?: string;
    concentration?: string;
    administrationRoute?: string;
    medicalJustification?: string;
    estimatedUnitCost?: number;
    itemStatus: string;
    rejectionReason?: string;
    aiAnalysis?: {
      decision: 'approved' | 'rejected' | 'partial' | 'requires_review' | 'pending';
      reasoning: string;
      confidence: number;
      approvedQuantity?: number;
      medicalAppropriatenessScore?: number;
      dosageAppropriatenessScore?: number;
      costEffectivenessScore?: number;
      hasDrugInteraction?: boolean;
      hasDosageConcern?: boolean;
      hasMedicalInconsistency?: boolean;
      hasCostConcern?: boolean;
      suggestions?: string[];
    };
  }[];

  @ApiProperty({ description: 'Indica si tiene archivos adjuntos' })
  hasAttachments: boolean;

  @ApiProperty({ description: 'Cantidad de archivos adjuntos' })
  attachmentCount: number;

  @ApiProperty({ description: 'Costo estimado total' })
  estimatedCost?: number;

  @ApiProperty({ description: 'Costo aprobado total' })
  approvedCost?: number;

  @ApiProperty({ description: 'Razón de rechazo' })
  rejectionReason?: string;

  @ApiProperty({ description: 'Estado de autorización' })
  authorizationStatus: string;

  @ApiProperty({ description: 'Tipo de autorización' })
  authorizationType?: string;

  @ApiProperty({ description: 'Autorizado por' })
  authorizedBy?: string;

  @ApiProperty({ description: 'Fecha de autorización' })
  authorizedAt?: Date;

  @ApiProperty({ description: 'Notas de autorización' })
  authorizationNotes?: string;

  @ApiProperty({ description: 'Resultado del análisis de IA' })
  aiAnalysisResult?: any;

  @ApiProperty({ description: 'Puntuación de confianza de IA' })
  aiConfidenceScore?: number;

  @ApiProperty({ description: 'Fecha de análisis de IA' })
  aiAnalyzedAt?: Date;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de última actualización' })
  updatedAt: Date;

  @ApiProperty({ description: 'Estadísticas del pedido' })
  stats: {
    totalItems: number;
    approvedItems: number;
    rejectedItems: number;
    pendingItems: number;
  };
}

export class MedicalOrderListResponseDto {
  @ApiProperty({ description: 'Lista de pedidos', type: [MedicalOrderResponseDto] })
  data: MedicalOrderResponseDto[];

  @ApiProperty({ description: 'Información de paginación' })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  @ApiProperty({ description: 'Estadísticas generales' })
  stats: {
    totalOrders: number;
    pendingOrders: number;
    approvedOrders: number;
    rejectedOrders: number;
    totalEstimatedCost: number;
    totalApprovedCost: number;
  };
}

export class CorrectMedicalOrderDto {
  @ApiPropertyOptional({ description: 'Nueva justificación médica general' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  medicalJustification?: string;

  @ApiPropertyOptional({ description: 'Nuevo diagnóstico' })
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiPropertyOptional({ description: 'Nuevo plan de tratamiento' })
  @IsOptional()
  @IsString()
  treatmentPlan?: string;

  @ApiPropertyOptional({ description: 'Correcciones específicas por item' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemCorrectionDto)
  itemCorrections?: ItemCorrectionDto[];

  @ApiProperty({ description: 'Comentarios sobre las correcciones realizadas' })
  @IsString()
  @IsNotEmpty()
  correctionNotes: string;

  @ApiPropertyOptional({ description: 'Solicitar nuevo análisis de IA después de las correcciones' })
  @IsOptional()
  @IsBoolean()
  requestNewAiAnalysis?: boolean;
}

export class ItemCorrectionDto {
  @ApiProperty({ description: 'ID del item a corregir' })
  @IsUUID()
  itemId: string;

  @ApiPropertyOptional({ description: 'Nueva cantidad solicitada' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  newQuantity?: number;

  @ApiPropertyOptional({ description: 'Nueva justificación médica del item' })
  @IsOptional()
  @IsString()
  newMedicalJustification?: string;

  @ApiPropertyOptional({ description: 'Reemplazar con un artículo alternativo' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateMedicalOrderItemDto)
  replacementItem?: CreateMedicalOrderItemDto;

  @ApiPropertyOptional({ description: 'Acción a realizar con el item' })
  @IsOptional()
  @IsEnum(['modify', 'replace', 'remove'])
  action?: 'modify' | 'replace' | 'remove';

  @ApiProperty({ description: 'Razón de la corrección' })
  @IsString()
  @IsNotEmpty()
  correctionReason: string;
}