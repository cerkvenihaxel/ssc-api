import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadDocumentDto {
  @ApiProperty({ 
    description: 'Additional notes about the document',
    required: false
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ 
    description: 'Document type (prescription, medical_report, etc.)',
    required: false
  })
  @IsOptional()
  @IsString()
  documentType?: string;
}