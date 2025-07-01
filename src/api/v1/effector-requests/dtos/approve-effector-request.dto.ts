import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class EffectorRequestItemApprovalDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  item_id: string;

  @ApiProperty({ enum: ['approved', 'rejected', 'partial'] })
  @IsEnum(['approved', 'rejected', 'partial'])
  decision: 'approved' | 'rejected' | 'partial';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  approved_quantity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  rejection_reason?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  auditor_comments?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  approved_unit_price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  alternative_suggestion?: string;
}

export class ApproveEffectorRequestDto {
  @ApiProperty({ enum: ['approved', 'rejected', 'partial', 'needs_review'] })
  @IsEnum(['approved', 'rejected', 'partial', 'needs_review'])
  decision: 'approved' | 'rejected' | 'partial' | 'needs_review';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  approval_comments?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  rejection_reason?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  requires_medical_review?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  requires_economic_review?: boolean;

  @ApiProperty({ type: [EffectorRequestItemApprovalDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EffectorRequestItemApprovalDto)
  items_approval?: EffectorRequestItemApprovalDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  approved_by_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  approved_by_role?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  administrative_notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  budget_impact_analysis?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  delivery_conditions?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  expiration_requirements?: string;
} 