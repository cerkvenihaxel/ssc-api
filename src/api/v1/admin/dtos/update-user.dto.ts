import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsEnum, IsArray, IsUUID } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ enum: ['active', 'inactive', 'suspended'], required: false })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'suspended'])
  status?: string;
}

export class UpdateUserPermissionsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}

export class BulkUpdateUsersDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID(4, { each: true })
  user_ids: string[];

  @ApiProperty({ enum: ['active', 'inactive', 'suspended'] })
  @IsEnum(['active', 'inactive', 'suspended'])
  status: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
} 