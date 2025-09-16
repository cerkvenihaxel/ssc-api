import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('ocr_documents')
export class OcrDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'original_name' })
  originalName: string;

  @Column({ name: 'mime_type' })
  mimeType: string;

  @Column({ name: 'file_path' })
  filePath: string;

  @Column({ name: 'extracted_text', type: 'text', nullable: true })
  extractedText: string;

  @Column({ name: 'ocr_result', type: 'jsonb', nullable: true })
  ocrResult: any;

  @Column({ name: 'medical_data', type: 'jsonb', nullable: true })
  medicalData: any;

  @Column({ 
    name: 'status',
    type: 'enum', 
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  })
  status: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'processed_by', nullable: true })
  processedBy: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}