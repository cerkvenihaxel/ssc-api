-- Migration: Create OCR Documents table
-- Description: Creates table for storing OCR document processing results

-- Create OCR status enum
CREATE TYPE ocr_status AS ENUM ('processing', 'completed', 'failed');

-- Create OCR documents table
CREATE TABLE ocr_documents (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_path TEXT NOT NULL,
    extracted_text TEXT,
    ocr_result JSONB,
    medical_data JSONB,
    status ocr_status DEFAULT 'processing',
    error_message TEXT,
    processed_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_ocr_documents_status ON ocr_documents(status);
CREATE INDEX idx_ocr_documents_created_at ON ocr_documents(created_at DESC);
CREATE INDEX idx_ocr_documents_processed_by ON ocr_documents(processed_by);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ocr_documents_updated_at 
    BEFORE UPDATE ON ocr_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE ocr_documents IS 'Stores uploaded documents and their OCR processing results';
COMMENT ON COLUMN ocr_documents.file_name IS 'Generated unique filename for the uploaded file';
COMMENT ON COLUMN ocr_documents.original_name IS 'Original filename as uploaded by user';
COMMENT ON COLUMN ocr_documents.extracted_text IS 'Text extracted from document via OCR';
COMMENT ON COLUMN ocr_documents.medical_data IS 'Structured medical information extracted from text';
COMMENT ON COLUMN ocr_documents.ocr_result IS 'Raw OCR processing result with confidence scores';
COMMENT ON COLUMN ocr_documents.processed_by IS 'User ID who uploaded the document';