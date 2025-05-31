import { PartialType } from '@nestjs/swagger';
import { CreateEffectorRequestDto } from './create-effector-request.dto';

export class UpdateEffectorRequestDto extends PartialType(CreateEffectorRequestDto) {} 