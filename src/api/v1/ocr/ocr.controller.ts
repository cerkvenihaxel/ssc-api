import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  BadRequestException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OcrService } from '../../../application/services/ocr/ocr.service';
import { UploadDocumentDto } from '../../dtos/ocr/upload-document.dto';
import { OcrResultDto } from '../../dtos/ocr/ocr-result.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { AdminGuard } from '../../guards/admin.guard';

@ApiTags('OCR Reader')
@Controller('v1/ocr')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload document for OCR processing' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Document uploaded successfully', type: OcrResultDto })
  @ApiResponse({ status: 400, description: 'Invalid file or request' })
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadDocumentDto,
  ): Promise<OcrResultDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed.');
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    const document = await this.ocrService.uploadDocument(
      file,
      uploadDto.notes,
      uploadDto.documentType,
    );

    return this.mapToDto(document);
  }

  @Get()
  @ApiOperation({ summary: 'Get all OCR documents with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
  async getDocuments(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<{ documents: OcrResultDto[], total: number, page: number, limit: number }> {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));

    const { documents, total } = await this.ocrService.getDocuments(pageNum, limitNum);

    return {
      documents: documents.map(doc => this.mapToDto(doc)),
      total,
      page: pageNum,
      limit: limitNum,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get OCR document by ID' })
  @ApiResponse({ status: 200, description: 'Document retrieved successfully', type: OcrResultDto })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async getDocument(@Param('id', ParseIntPipe) id: number): Promise<OcrResultDto> {
    const document = await this.ocrService.getDocument(id);
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return this.mapToDto(document);
  }

  @Post(':id/reprocess')
  @ApiOperation({ summary: 'Reprocess OCR for a document' })
  @ApiResponse({ status: 200, description: 'Document reprocessing started' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async reprocessDocument(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    const success = await this.ocrService.reprocessDocument(id);
    if (!success) {
      throw new NotFoundException('Document not found');
    }

    return { message: 'Document reprocessing started' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete OCR document' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async deleteDocument(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    const success = await this.ocrService.deleteDocument(id);
    if (!success) {
      throw new NotFoundException('Document not found');
    }

    return { message: 'Document deleted successfully' };
  }

  private mapToDto(document: any): OcrResultDto {
    return {
      id: document.id,
      fileName: document.fileName,
      originalName: document.originalName,
      extractedText: document.extractedText || '',
      medicalData: document.medicalData,
      status: document.status,
      errorMessage: document.errorMessage,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }
}