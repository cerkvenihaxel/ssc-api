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
  Request
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiBearerAuth,
  ApiQuery
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { AdminGuard, RequirePermission } from '../../guards/admin.guard';
import { AdminUserService } from '../../../application/services/admin/admin-user.service';
import { 
  CreateUserDto, 
  CreateProviderDto, 
  CreateAuditorDto, 
  CreateMedicoDto, 
  CreateEffectorDto,
  UpdateAuditorDto
} from './dtos/create-user.dto';
import { UpdateUserDto, UpdateUserPermissionsDto, BulkUpdateUsersDto } from './dtos/update-user.dto';

@ApiTags('admin-users')
@Controller('v1/admin/users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminUserController {
  constructor(private readonly adminUserService: AdminUserService) {}

  // ==================== USUARIOS GENERALES ====================

  @Get()
  @RequirePermission('VIEW_ALL_USERS')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'role', required: false, description: 'Filter by role' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of users retrieved successfully',
  })
  async findAllUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('role') role?: string,
  ): Promise<any> {
    return this.adminUserService.findAllUsers(page, limit, role);
  }

  @Get('stats')
  @RequirePermission('VIEW_ANALYTICS')
  @ApiOperation({ summary: 'Get user statistics (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User statistics retrieved successfully',
  })
  async getUserStats(): Promise<any> {
    return this.adminUserService.getUserStats();
  }

  // ==================== PROVEEDORES ====================

  @Get('providers')
  @RequirePermission('VIEW_ALL_USERS')
  @ApiOperation({ summary: 'Get all providers (Admin only)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of providers retrieved successfully',
  })
  async findAllProviders(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<any> {
    return this.adminUserService.findAllProviders(page, limit);
  }

  @Get('providers/:id')
  @RequirePermission('VIEW_ALL_USERS')
  @ApiOperation({ summary: 'Get provider by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Provider ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Provider retrieved successfully',
  })
  async findProviderById(@Param('id') id: string): Promise<any> {
    return this.adminUserService.findProviderById(id);
  }

  @Post('providers')
  @RequirePermission('CREATE_USERS')
  @ApiOperation({ summary: 'Create provider user (Admin only)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Provider user created successfully',
  })
  async createProvider(
    @Body() createProviderDto: CreateProviderDto,
    @Request() req: any,
  ): Promise<any> {
    const createdBy = req.user?.userId;
    return this.adminUserService.createProvider(createProviderDto, createdBy);
  }

  @Put('providers/:id')
  @RequirePermission('UPDATE_USERS')
  @ApiOperation({ summary: 'Update provider (Admin only)' })
  @ApiParam({ name: 'id', description: 'Provider ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Provider updated successfully',
  })
  async updateProvider(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateProviderDto>,
    @Request() req: any,
  ): Promise<any> {
    const updatedBy = req.user?.userId;
    return this.adminUserService.updateProvider(id, updateData, updatedBy);
  }

  @Delete('providers/:id')
  @RequirePermission('DELETE_USERS')
  @ApiOperation({ summary: 'Delete provider (Admin only)' })
  @ApiParam({ name: 'id', description: 'Provider ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Provider deleted successfully',
  })
  async deleteProvider(@Param('id') id: string): Promise<void> {
    await this.adminUserService.deleteProvider(id);
  }

  // ==================== EFECTORES ====================

  @Get('effectors')
  @RequirePermission('VIEW_ALL_USERS')
  @ApiOperation({ summary: 'Get all effectors (Admin only)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of effectors retrieved successfully',
  })
  async findAllEffectors(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<any> {
    return this.adminUserService.findAllEffectors(page, limit);
  }

  @Get('effectors/:id')
  @RequirePermission('VIEW_ALL_USERS')
  @ApiOperation({ summary: 'Get effector by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Effector ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Effector retrieved successfully',
  })
  async findEffectorById(@Param('id') id: string): Promise<any> {
    return this.adminUserService.findEffectorById(id);
  }

  @Post('effectors')
  @RequirePermission('CREATE_USERS')
  @ApiOperation({ summary: 'Create effector user (Admin only)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Effector user created successfully',
  })
  async createEffector(
    @Body() createEffectorDto: CreateEffectorDto,
    @Request() req: any,
  ): Promise<any> {
    const createdBy = req.user?.userId;
    return this.adminUserService.createEffector(createEffectorDto, createdBy);
  }

  @Put('effectors/:id')
  @RequirePermission('UPDATE_USERS')
  @ApiOperation({ summary: 'Update effector (Admin only)' })
  @ApiParam({ name: 'id', description: 'Effector ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Effector updated successfully',
  })
  async updateEffector(
    @Param('id') id: string,
    @Body() updateData: any,
    @Request() req: any,
  ): Promise<any> {
    const updatedBy = req.user?.userId;
    return this.adminUserService.updateEffector(id, updateData, updatedBy);
  }

  @Delete('effectors/:id')
  @RequirePermission('DELETE_USERS')
  @ApiOperation({ summary: 'Delete effector (Admin only)' })
  @ApiParam({ name: 'id', description: 'Effector ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Effector deleted successfully',
  })
  async deleteEffector(@Param('id') id: string): Promise<void> {
    await this.adminUserService.deleteEffector(id);
  }

  // ==================== AUDITORES ====================

  @Get('auditors')
  @RequirePermission('VIEW_ALL_USERS')
  @ApiOperation({ summary: 'Get all auditors (Admin only)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of auditors retrieved successfully',
  })
  async findAllAuditors(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<any> {
    return this.adminUserService.findAllAuditors(page, limit);
  }

  @Get('auditors/:id')
  @RequirePermission('VIEW_ALL_USERS')
  @ApiOperation({ summary: 'Get auditor by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'Auditor ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Auditor retrieved successfully',
  })
  async findAuditorById(@Param('id') id: string): Promise<any> {
    return this.adminUserService.findAuditorById(id);
  }

  @Post('auditors')
  @RequirePermission('CREATE_USERS')
  @ApiOperation({ summary: 'Create auditor user (Admin only)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Auditor user created successfully',
  })
  async createAuditor(
    @Body() createAuditorDto: CreateAuditorDto,
    @Request() req: any,
  ): Promise<any> {
    const createdBy = req.user?.userId;
    return this.adminUserService.createAuditor(createAuditorDto, createdBy);
  }

  @Put('auditors/:id')
  @RequirePermission('UPDATE_USERS')
  @ApiOperation({ summary: 'Update auditor (Admin only)' })
  @ApiParam({ name: 'id', description: 'Auditor ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Auditor updated successfully',
  })
  async updateAuditor(
    @Param('id') id: string,
    @Body() updateData: UpdateAuditorDto,
    @Request() req: any,
  ): Promise<any> {
    const updatedBy = req.user?.userId;
    return this.adminUserService.updateAuditor(id, updateData, updatedBy);
  }

  @Delete('auditors/:id')
  @RequirePermission('DELETE_USERS')
  @ApiOperation({ summary: 'Delete auditor (Admin only)' })
  @ApiParam({ name: 'id', description: 'Auditor ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Auditor deleted successfully',
  })
  async deleteAuditor(@Param('id') id: string): Promise<void> {
    await this.adminUserService.deleteAuditor(id);
  }

  // ==================== MÉDICOS ====================

  @Post('medicos')
  @RequirePermission('CREATE_USERS')
  @ApiOperation({ summary: 'Create medico user (Admin only)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Medico user created successfully',
  })
  async createMedico(
    @Body() createMedicoDto: CreateMedicoDto,
    @Request() req: any,
  ): Promise<any> {
    const createdBy = req.user?.userId;
    return this.adminUserService.createMedico(createMedicoDto, createdBy);
  }

  // ==================== USUARIOS POR ID (DEBE IR AL FINAL) ====================

  @Get(':id')
  @RequirePermission('VIEW_ALL_USERS')
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async findUserById(@Param('id') id: string): Promise<any> {
    return this.adminUserService.findUserById(id);
  }

  @Put(':id')
  @RequirePermission('UPDATE_USERS')
  @ApiOperation({ summary: 'Update user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User updated successfully',
  })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: any,
  ): Promise<any> {
    const updatedBy = req.user?.userId;
    return this.adminUserService.updateUser(id, updateUserDto, updatedBy);
  }

  @Patch(':id/permissions')
  @RequirePermission('UPDATE_USERS')
  @ApiOperation({ summary: 'Update user permissions (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User permissions updated successfully',
  })
  async updateUserPermissions(
    @Param('id') id: string,
    @Body() updatePermissionsDto: UpdateUserPermissionsDto,
  ): Promise<any> {
    return this.adminUserService.updateUserPermissions(id, updatePermissionsDto);
  }

  @Patch('bulk-update')
  @RequirePermission('UPDATE_USERS')
  @ApiOperation({ summary: 'Bulk update users (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users updated successfully',
  })
  async bulkUpdateUsers(@Body() bulkUpdateDto: BulkUpdateUsersDto): Promise<any> {
    return this.adminUserService.bulkUpdateUsers(bulkUpdateDto);
  }

  @Delete(':id')
  @RequirePermission('DELETE_USERS')
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'User deleted successfully',
  })
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.adminUserService.deleteUser(id);
  }
} 