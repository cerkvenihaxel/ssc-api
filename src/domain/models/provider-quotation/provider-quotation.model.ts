import { ApiProperty } from '@nestjs/swagger';

export class ProviderQuotationItem {
  @ApiProperty()
  quotation_item_id: string;

  @ApiProperty()
  quotation_id: string;

  @ApiProperty()
  request_item_id: string;

  @ApiProperty()
  unit_price: number;

  @ApiProperty()
  total_price: number;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  delivery_time_days?: number;

  @ApiProperty()
  observations?: string;

  @ApiProperty()
  created_at: Date;

  // Related data from request item
  @ApiProperty()
  request_item?: {
    item_id: string;
    article_name: string;
    description: string;
    quantity: number;
    unit_measure?: string;
  };
}

export class ProviderQuotationAttachment {
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

export class ProviderQuotation {
  @ApiProperty()
  quotation_id: string;

  @ApiProperty()
  request_id: string;

  @ApiProperty()
  provider_id: string;

  @ApiProperty()
  quotation_number: string;

  @ApiProperty()
  state_id: string;

  @ApiProperty()
  state?: {
    state_id: string;
    state_name: string;
    description?: string;
  };

  @ApiProperty()
  total_amount: number;

  @ApiProperty()
  delivery_time_days?: number;

  @ApiProperty()
  delivery_terms?: string;

  @ApiProperty()
  payment_terms?: string;

  @ApiProperty()
  warranty_terms?: string;

  @ApiProperty()
  observations?: string;

  @ApiProperty()
  valid_until?: Date;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiProperty()
  created_by?: string;

  @ApiProperty()
  updated_by?: string;

  @ApiProperty({ type: [ProviderQuotationItem] })
  items?: ProviderQuotationItem[];

  @ApiProperty({ type: [ProviderQuotationAttachment] })
  attachments?: ProviderQuotationAttachment[];

  // Related data
  @ApiProperty()
  provider?: {
    provider_id: string;
    provider_name: string;
    provider_type: string;
    cuit: string;
  };

  @ApiProperty()
  request?: {
    request_id: string;
    request_number: string;
    title: string;
    effector_id: string;
  };
} 