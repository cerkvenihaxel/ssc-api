import { ApiProperty } from '@nestjs/swagger';

export class EffectorRequestItem {
  @ApiProperty()
  item_id: string;

  @ApiProperty({ required: false, description: 'ID del artículo en el depósito' })
  article_id?: string;

  @ApiProperty()
  article_code?: string;

  @ApiProperty()
  article_name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unit_measure?: string;

  @ApiProperty()
  expiration_date?: Date;

  @ApiProperty()
  technical_specifications?: string;

  @ApiProperty()
  estimated_unit_price?: number;

  @ApiProperty()
  estimated_total_price?: number;

  @ApiProperty({ description: 'Justificación del artículo solicitado' })
  justification?: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  // Información del artículo del depósito (cuando está relacionado)
  @ApiProperty({ required: false })
  article?: {
    articuloId: string;
    codigo: string;
    nombre: string;
    descripcion?: string;
    presentacion?: string;
    stock?: number;
    grupoId?: string;
    grupoNombre?: string;
  };
}

export class EffectorRequestAttachment {
  @ApiProperty()
  attachment_id: string;

  @ApiProperty()
  file_name: string;

  @ApiProperty()
  file_path: string;

  @ApiProperty()
  file_type: string;

  @ApiProperty()
  file_size?: number;

  @ApiProperty()
  uploaded_by?: string;

  @ApiProperty()
  uploaded_at: Date;
}

export class EffectorRequest {
  @ApiProperty()
  request_id: string;

  @ApiProperty()
  effector_id: string;

  @ApiProperty()
  request_number: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  state_id: string;

  @ApiProperty()
  state?: {
    state_id: string;
    state_name: string;
    description?: string;
  };

  @ApiProperty({ enum: ['BAJA', 'NORMAL', 'ALTA', 'URGENTE'] })
  priority: string;

  @ApiProperty()
  delivery_date?: Date;

  @ApiProperty()
  delivery_address?: string;

  @ApiProperty()
  contact_person?: string;

  @ApiProperty()
  contact_phone?: string;

  @ApiProperty()
  contact_email?: string;

  @ApiProperty()
  total_estimated_amount?: number;

  @ApiProperty()
  institution_department?: string;

  @ApiProperty()
  institutional_justification?: string;

  @ApiProperty()
  estimated_beneficiaries?: number;

  @ApiProperty()
  urgency_context?: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiProperty()
  created_by?: string;

  @ApiProperty()
  updated_by?: string;

  @ApiProperty({ type: [EffectorRequestItem] })
  items?: EffectorRequestItem[];

  @ApiProperty({ type: [EffectorRequestAttachment] })
  attachments?: EffectorRequestAttachment[];

  // Información del efector (cuando está relacionado)
  @ApiProperty({ required: false })
  effector?: {
    user_id: string;
    nombre: string;
    email: string;
    cuil?: string;
    telefono?: string;
    direccion?: string;
    localidad?: string;
    provincia?: string;
  };

  // Información específica del efector para mostrar en frontend
  @ApiProperty({ required: false })
  effector_info?: {
    effector_name: string;
    effector_type: string;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    address?: string;
  };
} 