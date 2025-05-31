import { Module } from '@nestjs/common';
import { AdminEspecialidadesController } from './admin-especialidades.controller';
import { EspecialidadesModule } from '../especialidades/especialidades.module';
import { AdminUserModule } from './admin-user.module';

@Module({
  imports: [EspecialidadesModule, AdminUserModule],
  controllers: [AdminEspecialidadesController],
})
export class AdminEspecialidadesModule {} 