import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateAddressDto {
  @IsUUID()
  @IsNotEmpty()
  affiliateId: string;

  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsOptional()
  number?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  country?: string = 'Argentina';
} 