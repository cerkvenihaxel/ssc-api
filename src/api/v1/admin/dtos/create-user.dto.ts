import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsEnum, IsOptional, IsUUID, ValidateIf } from 'class-validator';

export enum UserRole {
  EFECTOR = 'Efector',
  PROVEEDOR = 'Proveedor',
  AUDITOR = 'Auditor',
  MEDICO = 'Médico',
  EMPLEADO = 'Empleado'
}

export class CreateUserDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiProperty({ enum: UserRole })
  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  password?: string; // Si no se proporciona, se generará automáticamente
}

export class CreateEffectorDto extends CreateUserDto {
  @ApiProperty()
  role: UserRole.EFECTOR = UserRole.EFECTOR;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  effector_name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  effector_type: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cuit?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  contact_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  contact_phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  contact_email?: string;

  @ApiProperty({ enum: ['active', 'inactive', 'pending'], required: false })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'pending'])
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  address?: {
    calle: string;
    numero: string;
    ciudad: string;
    provincia: string;
    codigo_postal: string;
  };

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  healthcare_providers?: string[]; // IDs de obras sociales asociadas
}

export class CreateProviderDto extends CreateUserDto {
  @ApiProperty()
  role: UserRole.PROVEEDOR = UserRole.PROVEEDOR;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  provider_name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  provider_type: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  cuit: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  contact_name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  contact_phone: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  contact_email: string;

  @ApiProperty({ enum: ['active', 'inactive', 'pending'] })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'pending'])
  status?: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  specialties?: string[]; // IDs de especialidades

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  healthcare_providers?: string[]; // IDs de obras sociales
}

export class CreateAuditorDto extends CreateUserDto {
  @ApiProperty()
  role: UserRole.AUDITOR = UserRole.AUDITOR;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  first_name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  last_name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  employee_id?: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  permissions?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  healthcare_providers?: string[]; // IDs de obras sociales asociadas
}

export class CreateMedicoDto extends CreateUserDto {
  @ApiProperty()
  role: UserRole.MEDICO = UserRole.MEDICO;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  matricula: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  especialidad_id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  first_name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  last_name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  picture?: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  healthcare_providers?: string[]; // IDs de obras sociales asociadas
}

// DTO específico para actualizar auditor
export class UpdateAuditorDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiProperty({ enum: ['active', 'inactive', 'suspended'], required: false })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'suspended'])
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  employee_id?: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  permissions?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  healthcare_providers?: string[]; // IDs de obras sociales asociadas

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}

export class UpdateEffectorDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiProperty({ enum: ['active', 'inactive', 'suspended'], required: false })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'suspended'])
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  effector_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  effector_type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cuit?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  contact_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  contact_phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  contact_email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  address?: {
    calle: string;
    numero: string;
    ciudad: string;
    provincia: string;
    codigo_postal: string;
  };

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  healthcare_providers?: string[]; // IDs de obras sociales asociadas

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  updatedBy?: string;
} 