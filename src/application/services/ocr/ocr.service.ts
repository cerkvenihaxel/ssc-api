import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OcrDocument } from '../../../entities/ocr-document.entity';
import { createWorker } from 'tesseract.js';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  constructor(
    @InjectRepository(OcrDocument)
    private ocrDocumentRepository: Repository<OcrDocument>,
  ) {}

  async uploadDocument(
    file: Express.Multer.File,
    notes?: string,
    documentType?: string,
    processedBy?: number,
  ): Promise<OcrDocument> {
    const uploadDir = path.join(process.cwd(), 'uploads', 'ocr');

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    // Save file
    fs.writeFileSync(filePath, file.buffer);

    // Create OCR document record
    const ocrDocument = this.ocrDocumentRepository.create({
      fileName,
      originalName: file.originalname,
      mimeType: file.mimetype,
      filePath,
      status: 'processing',
      processedBy,
    });

    const savedDocument = await this.ocrDocumentRepository.save(ocrDocument);

    // Process OCR asynchronously
    this.processOcr(savedDocument.id).catch((error) => {
      this.logger.error(
        `Failed to process OCR for document ${savedDocument.id}:`,
        error,
      );
    });

    return savedDocument;
  }

  async processOcr(documentId: number): Promise<void> {
    const document = await this.ocrDocumentRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      this.logger.error(`Document with ID ${documentId} not found`);
      return;
    }

    try {
      this.logger.log(`Starting OCR processing for document ${documentId}`);

      const worker = await createWorker('spa'); // Spanish language

      const {
        data: { text, words, confidence },
      } = await worker.recognize(document.filePath);

      await worker.terminate();

      this.logger.log(
        `OCR processing completed for document ${documentId} with confidence: ${confidence}`,
      );

      // Extract medical data from text
      const medicalData = this.extractMedicalData(text);

      // Update document with results
      await this.ocrDocumentRepository.update(documentId, {
        extractedText: text,
        ocrResult: { words, confidence } as any,
        medicalData,
        status: 'completed',
      });
    } catch (error) {
      this.logger.error(
        `OCR processing failed for document ${documentId}:`,
        error,
      );

      await this.ocrDocumentRepository.update(documentId, {
        status: 'failed',
        errorMessage: error.message,
      });
    }
  }

  private extractMedicalData(text: string): any {
    const medicalData: any = {};

    // Extract patient name (assuming format "Paciente: NAME" or "Para: NAME")
    const patientMatch = text.match(/(?:paciente|para):\s*([^\n\r]+)/i);
    if (patientMatch) {
      medicalData.patientName = patientMatch[1].trim();
    }

    // Extract doctor name (assuming format "Dr./Dra. NAME" or "Médico: NAME")
    const doctorMatch = text.match(
      /(?:dr\.?|dra\.?|médico|doctor)[\s:]*([^\n\r]+)/i,
    );
    if (doctorMatch) {
      medicalData.doctorName = doctorMatch[1].trim();
    }

    // Extract medications (look for common medication patterns)
    const medicationPatterns = [
      /([A-Z][a-z]+)\s*\d+\s*mg/gi,
      /([A-Z][a-z]+)\s*\d+\s*g/gi,
      /([A-Z][a-z]+)\s*\d+\s*ml/gi,
    ];

    const medications: string[] = [];
    medicationPatterns.forEach((pattern) => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && !medications.includes(match[1])) {
          medications.push(match[1]);
        }
      }
    });

    if (medications.length > 0) {
      medicalData.medications = medications;
    }

    // Extract dates (DD/MM/YYYY or DD-MM-YYYY format)
    const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/);
    if (dateMatch) {
      medicalData.date = dateMatch[1];
    }

    // Extract diagnosis (assuming format "Diagnóstico: TEXT")
    const diagnosisMatch = text.match(/diagnóstico:\s*([^\n\r]+)/i);
    if (diagnosisMatch) {
      medicalData.diagnosis = diagnosisMatch[1].trim();
    }

    // Extract prescription number
    const prescriptionMatch = text.match(
      /(?:receta|prescripción)\s*(?:n[ºo°]?\.?\s*)?(\d+)/i,
    );
    if (prescriptionMatch) {
      medicalData.prescriptionNumber = prescriptionMatch[1];
    }

    return Object.keys(medicalData).length > 0 ? medicalData : null;
  }

  async getDocuments(
    page: number = 1,
    limit: number = 10,
  ): Promise<{ documents: OcrDocument[]; total: number }> {
    const [documents, total] = await this.ocrDocumentRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { documents, total };
  }

  async getDocument(id: number): Promise<OcrDocument | null> {
    return this.ocrDocumentRepository.findOne({
      where: { id },
    });
  }

  async deleteDocument(id: number): Promise<boolean> {
    const document = await this.getDocument(id);
    if (!document) {
      return false;
    }

    // Delete file from filesystem
    try {
      if (fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath);
      }
    } catch (error) {
      this.logger.warn(`Failed to delete file ${document.filePath}:`, error);
    }

    // Delete database record
    await this.ocrDocumentRepository.delete(id);
    return true;
  }

  async reprocessDocument(id: number): Promise<boolean> {
    const document = await this.getDocument(id);
    if (!document) {
      return false;
    }

    await this.ocrDocumentRepository.update(id, {
      status: 'processing',
      errorMessage: null,
      extractedText: null,
      ocrResult: null,
      medicalData: null,
    });

    this.processOcr(id).catch((error) => {
      this.logger.error(`Failed to reprocess OCR for document ${id}:`, error);
    });

    return true;
  }
}
