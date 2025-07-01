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
import { ApproveEffectorRequestDto } from './dtos/approve-effector-request.dto';
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
    // Debug logs
    console.log('🐛 Create request received');
    console.log('📋 CreateDto:', createDto);
    console.log('👤 User info:', req.user);
    console.log('🔑 CreateDto.effector_id:', createDto.effector_id);
    
    // Si el usuario es admin y especifica effector_id, usar ese
    // Si no, usar el userId del JWT (efector logueado)
    const userRole = req.user?.role || req.user?.roleName;
    const isAdmin = userRole === 'Admin' || userRole === 'Administrador' || req.user?.isAdmin || req.user?.roleId === 1;
    
    console.log('🛡️ User role:', userRole);
    console.log('🔢 User roleId:', req.user?.roleId);
    console.log('👑 Is admin:', isAdmin);
    
    const effectorId = (isAdmin && createDto.effector_id) 
      ? createDto.effector_id 
      : req.user?.userId;
    
    const createdBy = req.user?.userId;
    
    console.log('🎯 Final effectorId:', effectorId);
    console.log('✍️ CreatedBy:', createdBy);
    
    return this.effectorRequestService.create(createDto, effectorId, createdBy);
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

  @Post(':id/ai-analyze')
  @ApiOperation({ summary: 'Analyze effector request with AI' })
  @ApiParam({ name: 'id', description: 'Effector request ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'AI analysis completed successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Effector request not found',
  })
  async analyzeWithAI(@Param('id') id: string): Promise<any> {
    return this.effectorRequestService.analyzeWithAI(id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve or reject an effector request' })
  @ApiParam({ name: 'id', description: 'Effector request ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Request approval decision processed successfully',
    type: EffectorRequest,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Effector request not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid approval data',
  })
  async approveRequest(
    @Param('id') id: string,
    @Body() approvalDto: ApproveEffectorRequestDto,
    @Request() req: any,
  ): Promise<EffectorRequest> {
    const approvedBy = req.user?.userId || 'anonymous';
    return this.effectorRequestService.approveRequest(id, approvalDto, approvedBy);
  }

  @Get('admin/pending-review')
  @ApiOperation({ summary: 'Get requests requiring review (admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of requests requiring review',
    type: EffectorRequest,
    isArray: true,
  })
  async getRequestsRequiringReview(): Promise<EffectorRequest[]> {
    return this.effectorRequestService.getRequestsRequiringReview();
  }

  @Get('admin/statistics')
  @ApiOperation({ summary: 'Get request statistics (admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Request statistics',
  })
  async getRequestStatistics(): Promise<any> {
    return this.effectorRequestService.getRequestStatistics();
  }

  @Get('priority/:priority')
  @ApiOperation({ summary: 'Get requests by priority level' })
  @ApiParam({ name: 'priority', description: 'Priority level (BAJA, NORMAL, ALTA, URGENTE)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of requests with specified priority',
    type: EffectorRequest,
    isArray: true,
  })
  async getRequestsByPriority(@Param('priority') priority: string): Promise<EffectorRequest[]> {
    return this.effectorRequestService.getRequestsByPriority(priority);
  }
} 