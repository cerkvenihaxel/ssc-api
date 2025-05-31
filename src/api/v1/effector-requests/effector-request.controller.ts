import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Patch,
  Delete, 
  Body, 
  Param, 
  Query,
  HttpStatus, 
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFiles
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '@/api/guards/jwt-auth.guard';
import { EffectorRequestService } from '../../../application/services/effector-request/effector-request.service';
import { CreateEffectorRequestDto } from './dtos/create-effector-request.dto';
import { UpdateEffectorRequestDto } from './dtos/update-effector-request.dto';
import { UpdateRequestStateDto } from './dtos/update-request-state.dto';
import { EffectorRequest } from '../../../domain/models/effector-request/effector-request.model';

@ApiTags('effector-requests')
@Controller('v1/effector-requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class EffectorRequestController {
  constructor(private readonly effectorRequestService: EffectorRequestService) {}

  @Get()
  @ApiOperation({ summary: 'Get all effector requests' })
  @ApiQuery({ name: 'effectorId', required: false, description: 'Filter by effector ID' })
  @ApiQuery({ name: 'state', required: false, description: 'Filter by state' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of effector requests',
    type: EffectorRequest,
    isArray: true,
  })
  async findAll(
    @Query('effectorId') effectorId?: string,
    @Query('state') state?: string,
  ): Promise<EffectorRequest[]> {
    if (effectorId) {
      return this.effectorRequestService.findByEffectorId(effectorId);
    }
    if (state) {
      return this.effectorRequestService.findByState(state);
    }
    return this.effectorRequestService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an effector request by ID' })
  @ApiParam({ name: 'id', description: 'Effector request ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The effector request has been found',
    type: EffectorRequest,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Effector request not found',
  })
  async findById(@Param('id') id: string): Promise<EffectorRequest> {
    return this.effectorRequestService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new effector request' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The effector request has been successfully created',
    type: EffectorRequest,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async create(
    @Body() createDto: CreateEffectorRequestDto,
    @Request() req: any,
  ): Promise<EffectorRequest> {
    const effectorId = req.user?.userId; // Assuming JWT contains userId
    return this.effectorRequestService.create(createDto, effectorId);
  }

  @Post(':id/attachments')
  @ApiOperation({ summary: 'Upload attachments to an effector request' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'Effector request ID' })
  @UseInterceptors(FilesInterceptor('files', 10, {
    fileFilter: (req, file, callback) => {
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (allowedTypes.includes(file.mimetype)) {
        callback(null, true);
      } else {
        callback(new Error('Only PDF and DOCX files are allowed'), false);
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  }))
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Files uploaded successfully',
  })
  async uploadAttachments(
    @Param('id') id: string,
    @UploadedFiles() files: any[],
    @Request() req: any,
  ): Promise<{ message: string; files: any[] }> {
    // TODO: Implement file upload logic
    // This would typically save files to storage and create attachment records
    return {
      message: 'Files uploaded successfully',
      files: files.map(file => ({
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      })),
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an effector request' })
  @ApiParam({ name: 'id', description: 'Effector request ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The effector request has been successfully updated',
    type: EffectorRequest,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Effector request not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateEffectorRequestDto,
    @Request() req: any,
  ): Promise<EffectorRequest> {
    const updatedBy = req.user?.userId;
    return this.effectorRequestService.update(id, updateDto, updatedBy);
  }

  @Patch(':id/state')
  @ApiOperation({ summary: 'Update effector request state (for auditors)' })
  @ApiParam({ name: 'id', description: 'Effector request ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The request state has been successfully updated',
    type: EffectorRequest,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Effector request not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid state transition',
  })
  async updateState(
    @Param('id') id: string,
    @Body() updateStateDto: UpdateRequestStateDto,
    @Request() req: any,
  ): Promise<EffectorRequest> {
    const updatedBy = req.user?.userId;
    return this.effectorRequestService.updateState(id, updateStateDto, updatedBy);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an effector request' })
  @ApiParam({ name: 'id', description: 'Effector request ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The effector request has been successfully deleted',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Effector request not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete request in current state',
  })
  async delete(@Param('id') id: string): Promise<void> {
    await this.effectorRequestService.delete(id);
  }
} 