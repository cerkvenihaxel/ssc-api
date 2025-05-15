import { Module } from '@nestjs/common';
import { AddressController } from './address.controller';
import { AddressService } from '@/application/services/address/address.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from '@domain/entities/address.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Address])],
  controllers: [AddressController],
  providers: [AddressService],
  exports: [AddressService],
})
export class AddressModule {} 