import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { OcrController } from './ocr.controller';
import { OcrService } from '../../../application/services/ocr/ocr.service';
import { OcrDocument } from '../../../entities/ocr-document.entity';
import { AdminUserModule } from '../admin/admin-user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OcrDocument]),
    AdminUserModule,
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type'), false);
        }
      },
    }),
  ],
  controllers: [OcrController],
  providers: [OcrService],
  exports: [OcrService],
})
export class OcrModule {}