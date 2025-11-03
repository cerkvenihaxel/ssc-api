import { ApiProperty } from '@nestjs/swagger';

export class OcrResultDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  extractedText: string;

  @ApiProperty({ required: false })
  medicalData?: {
    patientName?: string;
    doctorName?: string;
    medications?: string[];
    diagnosis?: string;
    date?: string;
    prescriptionNumber?: string;
  };

  @ApiProperty()
  status: string;

  @ApiProperty({ required: false })
  errorMessage?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}