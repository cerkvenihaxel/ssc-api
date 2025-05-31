import { Injectable, NotFoundException, BadRequestException, ConflictException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../../../infrastructure/persistence/postgres/entities/usuario.entity';
import { ProveedorEntity } from '../../../infrastructure/persistence/postgres/entities/proveedor.entity';
import { CreateUserDto, CreateProviderDto, CreateAuditorDto, CreateMedicoDto, CreateEffectorDto, UserRole, UpdateAuditorDto } from '../../../api/v1/admin/dtos/create-user.dto';
import { UpdateUserDto, UpdateUserPermissionsDto, BulkUpdateUsersDto } from '../../../api/v1/admin/dtos/update-user.dto';
import { IUserRepository } from '../../../domain/repositories/user/user.repository';

@Injectable()
export class AdminUserService {
  constructor(
    @InjectRepository(Usuario)
    private readonly userRepository: Repository<Usuario>,
    @InjectRepository(ProveedorEntity)
    private readonly providerRepository: Repository<ProveedorEntity>,
    @Inject('IUserRepository')
    private readonly userRepo: IUserRepository,
  ) {}

  async createUser(createUserDto: CreateUserDto, createdBy: string): Promise<any> {
    try {
      console.log('🚀 Iniciando createUser con datos:', { email: createUserDto.email, nombre: createUserDto.nombre, role: createUserDto.role });
      
      const pool = (this.userRepo as any).pool;
      console.log('📊 Pool obtenido:', !!pool);
      
      if (!pool) {
        throw new BadRequestException('Pool de conexión no disponible');
      }
      
      // Verificar que el email no esté en uso
      console.log('🔍 Verificando email único...');
      const emailExistsQuery = 'SELECT user_id FROM usuarios WHERE email = $1';
      const emailExistsResult = await pool.query(emailExistsQuery, [createUserDto.email]);
      console.log('📧 Resultado verificación email:', emailExistsResult.rows.length);
      
      if (emailExistsResult.rows.length > 0) {
        throw new ConflictException('El email ya está en uso por otro usuario');
      }

      // Obtener el role_id basado en el nombre del rol
      console.log('👤 Buscando rol:', createUserDto.role);
      const roleQuery = 'SELECT role_id FROM roles WHERE role_name = $1';
      const roleResult = await pool.query(roleQuery, [createUserDto.role]);
      console.log('🏷️ Resultado búsqueda rol:', roleResult.rows);
      
      if (roleResult.rows.length === 0) {
        throw new BadRequestException(`Rol '${createUserDto.role}' no encontrado`);
      }
      
      const roleId = roleResult.rows[0].role_id;
      console.log('🆔 Role ID encontrado:', roleId);

      // Generar contraseña si no se proporciona
      const password = createUserDto.password || this.generateRandomPassword();
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log('🔐 Contraseña hasheada generada');

      // Generar UUID para el nuevo usuario
      const userId = require('crypto').randomUUID();
      console.log('🎯 User ID generado:', userId);

      // Crear el usuario en la base de datos
      console.log('💾 Insertando usuario en base de datos...');
      const createUserQuery = `
        INSERT INTO usuarios (
          user_id, 
          email, 
          nombre, 
          password_hash, 
          role_id, 
          status, 
          email_verified, 
          created_at, 
          updated_at, 
          created_by
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9)
        RETURNING user_id, email, nombre, status, created_at, updated_at
      `;

      const createUserParams = [
        userId,
        createUserDto.email,
        createUserDto.nombre,
        hashedPassword,
        roleId,
        'active',
        false, // email_verified
        new Date(),
        createdBy
      ];
      
      console.log('📋 Parámetros de inserción:', { userId, email: createUserDto.email, nombre: createUserDto.nombre, roleId });
      
      const createUserResult = await pool.query(createUserQuery, createUserParams);
      console.log('✅ Usuario insertado:', createUserResult.rows[0]);

      const newUser = createUserResult.rows[0];

      // Obtener el usuario completo con información del rol
      console.log('🔄 Obteniendo usuario completo con rol...');
      const userWithRoleQuery = `
        SELECT 
          u.user_id,
          u.email,
          u.nombre,
          u.status,
          u.created_at,
          u.updated_at,
          u.email_verified,
          r.role_id,
          r.role_name
        FROM usuarios u
        JOIN roles r ON u.role_id = r.role_id
        WHERE u.user_id = $1
      `;

      const userWithRoleResult = await pool.query(userWithRoleQuery, [userId]);
      console.log('👥 Usuario con rol obtenido:', userWithRoleResult.rows[0]);
      
      const userData = userWithRoleResult.rows[0];

      const result = {
        user_id: userData.user_id,
        email: userData.email,
        nombre: userData.nombre,
        role: {
          role_id: userData.role_id,
          role_name: userData.role_name
        },
        status: userData.status,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
        email_verified: userData.email_verified,
        temporaryPassword: !createUserDto.password ? password : undefined, // Solo mostrar la contraseña generada
        message: 'Usuario creado exitosamente'
      };
      
      console.log('🎉 Usuario creado exitosamente:', { user_id: result.user_id, email: result.email });
      return result;
    } catch (error) {
      console.error('❌ Error creating user:', error);
      console.error('📍 Stack trace:', error.stack);
      
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException('Error al crear el usuario');
    }
  }

  async createEffector(createEffectorDto: CreateEffectorDto, createdBy: string): Promise<any> {
    try {
      // Crear el usuario base primero
      const user = await this.createUser(createEffectorDto, createdBy);
      
      // Intentar guardar información específica del efector en campo JSON
      const pool = (this.userRepo as any).pool;
      
      if (user && user.user_id) {
        const effectorSpecificData = {
          effector_name: createEffectorDto.effector_name,
          effector_type: createEffectorDto.effector_type,
          cuit: createEffectorDto.cuit,
          contact_name: createEffectorDto.contact_name,
          contact_phone: createEffectorDto.contact_phone,
          contact_email: createEffectorDto.contact_email,
          address: createEffectorDto.address
        };

        try {
          // Intentar agregar la columna effector_info si no existe
          try {
            await pool.query(`
              ALTER TABLE usuarios 
              ADD COLUMN IF NOT EXISTS effector_info TEXT
            `);
          } catch (alterError) {
            // Si falla, intentar sin IF NOT EXISTS (para bases de datos que no lo soportan)
            try {
              await pool.query(`
                ALTER TABLE usuarios 
                ADD COLUMN effector_info TEXT
              `);
            } catch (alterError2) {
              console.log('⚠️ No se pudo agregar el campo effector_info:', alterError2.message);
            }
          }

          // Intentar guardar la información específica del efector
          const updateQuery = `
            UPDATE usuarios 
            SET effector_info = $1
            WHERE user_id = $2
          `;
          
          await pool.query(updateQuery, [JSON.stringify(effectorSpecificData), user.user_id]);
          console.log('✅ Información específica del efector guardada exitosamente');
          
        } catch (jsonError) {
          console.log('⚠️ No se pudo guardar effector_info:', jsonError.message);
          // Continuar sin error para no romper la funcionalidad básica
        }

        // Asociar con obras sociales si se proporcionan
        if (createEffectorDto.healthcare_providers && createEffectorDto.healthcare_providers.length > 0) {
          try {
            for (const healthcareProviderId of createEffectorDto.healthcare_providers) {
              await pool.query(`
                INSERT INTO efectores_obras_sociales (effector_user_id, healthcare_provider_id, created_by)
                VALUES ($1, $2, $3)
                ON CONFLICT (effector_user_id, healthcare_provider_id) DO NOTHING
              `, [user.user_id, healthcareProviderId, createdBy]);
            }
            console.log('✅ Obras sociales asociadas al efector exitosamente');
          } catch (healthcareError) {
            console.log('⚠️ Error asociando obras sociales:', healthcareError.message);
          }
        }
      }
      
      return {
        ...user,
        effector_info: {
          effector_name: createEffectorDto.effector_name,
          effector_type: createEffectorDto.effector_type,
          cuit: createEffectorDto.cuit,
          contact_name: createEffectorDto.contact_name,
          contact_phone: createEffectorDto.contact_phone,
          contact_email: createEffectorDto.contact_email,
          address: createEffectorDto.address,
          healthcare_providers: createEffectorDto.healthcare_providers || []
        },
        message: 'Usuario efector creado exitosamente.'
      };
    } catch (error) {
      console.error('Error creating effector:', error);
      throw error; // Re-lanzar el error para que el controlador lo maneje
    }
  }

  async createProvider(createProviderDto: CreateProviderDto, createdBy: string): Promise<any> {
    try {
      // Verificar que no exista un proveedor con el mismo CUIT
      const existingProvider = await this.providerRepository.findOne({
        where: { cuit: createProviderDto.cuit }
      });

      if (existingProvider) {
        throw new ConflictException('Provider with this CUIT already exists');
      }

      // Crear el usuario base primero
      const user = await this.createUser(createProviderDto, createdBy);

      // Generar ID para el proveedor
      const providerId = require('crypto').randomUUID();

      // Crear registro de proveedor
      const provider = this.providerRepository.create({
        providerId: providerId,
        providerName: createProviderDto.provider_name,
        providerType: createProviderDto.provider_type,
        cuit: createProviderDto.cuit,
        contactName: createProviderDto.contact_name,
        contactPhone: createProviderDto.contact_phone,
        contactEmail: createProviderDto.contact_email,
        status: createProviderDto.status || 'active',
        userId: user.user_id, // Asociar con el usuario creado
        createdBy: createdBy,
        creationDate: new Date(),
        lastUpdate: new Date(),
      });

      const savedProvider = await this.providerRepository.save(provider);

      // TODO: Asociar especialidades y obras sociales si se proporcionan

      return {
        user: user,
        provider: {
          providerId: savedProvider.providerId,
          providerName: savedProvider.providerName,
          providerType: savedProvider.providerType,
          cuit: savedProvider.cuit,
          contactName: savedProvider.contactName,
          contactPhone: savedProvider.contactPhone,
          contactEmail: savedProvider.contactEmail,
          status: savedProvider.status,
          creationDate: savedProvider.creationDate,
          lastUpdate: savedProvider.lastUpdate
        },
        message: 'Usuario proveedor creado exitosamente con usuario asociado.',
        temporaryPassword: user.temporaryPassword
      };
    } catch (error) {
      console.error('Error creating provider:', error);
      
      if (error instanceof ConflictException) {
        throw error;
      }
      
      throw new BadRequestException('Error al crear el usuario proveedor');
    }
  }

  async createAuditor(createAuditorDto: CreateAuditorDto, createdBy: string): Promise<any> {
    try {
      // Crear el usuario base primero
      const user = await this.createUser(createAuditorDto, createdBy);
      
      // Intentar guardar información específica del auditor en campo JSON
      const pool = (this.userRepo as any).pool;
      
      if (user && user.user_id) {
        const auditorSpecificData = {
          first_name: createAuditorDto.first_name,
          last_name: createAuditorDto.last_name,
          phone: createAuditorDto.phone,
          department: createAuditorDto.department,
          employee_id: createAuditorDto.employee_id,
          permissions: createAuditorDto.permissions
        };

        try {
          // Intentar agregar la columna auditor_info si no existe
          try {
            await pool.query(`
              ALTER TABLE usuarios 
              ADD COLUMN IF NOT EXISTS auditor_info TEXT
            `);
          } catch (alterError) {
            // Si falla, intentar sin IF NOT EXISTS (para bases de datos que no lo soportan)
            try {
              await pool.query(`
                ALTER TABLE usuarios 
                ADD COLUMN auditor_info TEXT
              `);
            } catch (alterError2) {
              console.log('⚠️ No se pudo agregar el campo auditor_info:', alterError2.message);
            }
          }

          // Intentar guardar la información específica del auditor
          const updateQuery = `
            UPDATE usuarios 
            SET auditor_info = $1
            WHERE user_id = $2
          `;
          
          await pool.query(updateQuery, [JSON.stringify(auditorSpecificData), user.user_id]);
          console.log('✅ Información específica del auditor guardada exitosamente');
          
        } catch (jsonError) {
          console.log('⚠️ No se pudo guardar auditor_info:', jsonError.message);
          // Continuar sin error para no romper la funcionalidad básica
        }

        // Asociar con obras sociales si se proporcionan
        if (createAuditorDto.healthcare_providers && createAuditorDto.healthcare_providers.length > 0) {
          try {
            for (const healthcareProviderId of createAuditorDto.healthcare_providers) {
              await pool.query(`
                INSERT INTO auditores_obras_sociales (auditor_user_id, healthcare_provider_id, created_by)
                VALUES ($1, $2, $3)
                ON CONFLICT (auditor_user_id, healthcare_provider_id) DO NOTHING
              `, [user.user_id, healthcareProviderId, createdBy]);
            }
            console.log('✅ Obras sociales asociadas al auditor exitosamente');
          } catch (healthcareError) {
            console.log('⚠️ Error asociando obras sociales:', healthcareError.message);
          }
        }
      }
      
      return {
        ...user,
        auditor_info: {
          first_name: createAuditorDto.first_name,
          last_name: createAuditorDto.last_name,
          phone: createAuditorDto.phone,
          department: createAuditorDto.department,
          employee_id: createAuditorDto.employee_id,
          permissions: createAuditorDto.permissions,
          healthcare_providers: createAuditorDto.healthcare_providers || []
        },
        message: 'Usuario auditor creado exitosamente.'
      };
    } catch (error) {
      console.error('Error creating auditor:', error);
      throw error; // Re-lanzar el error para que el controlador lo maneje
    }
  }

  async createMedico(createMedicoDto: CreateMedicoDto, createdBy: string): Promise<Usuario> {
    // TODO: Implementar cuando se tenga la entidad de médicos correcta
    throw new BadRequestException('Medico creation functionality needs medicos table implementation');
  }

  async findAllUsers(page: number = 1, limit: number = 10, role?: string): Promise<{ users: any[], total: number }> {
    try {
      // Usar el repositorio de usuario para hacer las consultas directamente
      const pool = (this.userRepo as any).pool;
      
      // Consulta básica para obtener usuarios con información de roles
      let query = `
        SELECT 
          u.user_id,
          u.email,
          u.nombre,
          u.status,
          u.created_at,
          r.role_id,
          r.role_name
        FROM usuarios u
        JOIN roles r ON u.role_id = r.role_id
      `;
      
      const queryParams: any[] = [];
      let paramIndex = 1;

      // Filtro por rol si se especifica
      if (role) {
        query += ` WHERE r.role_name = $${paramIndex}`;
        queryParams.push(role);
        paramIndex++;
      }

      // Agregar ordenamiento y paginación
      query += ` ORDER BY u.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(limit, (page - 1) * limit);

      // Ejecutar consulta principal
      const usersResult = await pool.query(query, queryParams);

      // Consulta para el total de registros
      let countQuery = `
        SELECT COUNT(*) as total
        FROM usuarios u
        JOIN roles r ON u.role_id = r.role_id
      `;
      
      const countParams: any[] = [];
      if (role) {
        countQuery += ` WHERE r.role_name = $1`;
        countParams.push(role);
      }

      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      // Mapear resultados al formato esperado por el frontend
      const users = usersResult.rows.map((row: any) => ({
        user_id: row.user_id,
        email: row.email,
        nombre: row.nombre,
        role: {
          role_id: row.role_id,
          role_name: row.role_name
        },
        status: row.status || 'active',
        created_at: row.created_at
      }));

      return {
        users,
        total
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new BadRequestException('Error al obtener la lista de usuarios');
    }
  }

  async findAllProviders(page: number = 1, limit: number = 10): Promise<{ providers: any[], total: number }> {
    try {
      const pool = (this.userRepo as any).pool;
      
      // Consulta para obtener proveedores con información completa del usuario (LEFT JOIN para incluir proveedores sin usuario)
      const query = `
        SELECT 
          u.user_id,
          u.email,
          u.nombre,
          u.status as user_status,
          u.created_at,
          u.updated_at,
          u.last_login,
          u.email_verified,
          r.role_id,
          r.role_name,
          p.provider_id,
          p.provider_name,
          p.provider_type,
          p.cuit,
          p.contact_name,
          p.contact_phone,
          p.contact_email,
          p.status as provider_status,
          p.creation_date,
          p.last_update
        FROM proveedores p
        LEFT JOIN usuarios u ON p.user_id = u.user_id
        LEFT JOIN roles r ON u.role_id = r.role_id
        ORDER BY p.creation_date DESC
        LIMIT $1 OFFSET $2
      `;
      
      const offset = (page - 1) * limit;
      const providersResult = await pool.query(query, [limit, offset]);
      
      // Consulta para obtener el total de proveedores
      const countQuery = `
        SELECT COUNT(*) as total
        FROM proveedores p
      `;
      
      const countResult = await pool.query(countQuery);
      const total = parseInt(countResult.rows[0].total);
      
      // Mapear resultados al formato consistente
      const providers = providersResult.rows.map((row: any) => {
        // Determinar el status a usar (prioridad: usuario, luego proveedor, luego default)
        const finalStatus = row.user_status || row.provider_status || 'active';
        
        return {
          // Información del usuario base (puede ser null si no hay usuario asociado)
          user_id: row.user_id,
          email: row.email,
          nombre: row.nombre,
          role: row.role_id ? {
            role_id: row.role_id,
            role_name: row.role_name
          } : null,
          status: finalStatus,
          created_at: row.created_at,
          updated_at: row.updated_at,
          last_login: row.last_login,
          email_verified: row.email_verified || false,
          
          // Información específica del proveedor
          provider_info: {
            provider_id: row.provider_id,
            provider_name: row.provider_name,
            provider_type: row.provider_type,
            cuit: row.cuit,
            contact_name: row.contact_name,
            contact_phone: row.contact_phone,
            contact_email: row.contact_email,
            provider_status: row.provider_status,
            creation_date: row.creation_date,
            last_update: row.last_update
          },
          
          // Campos adicionales para compatibilidad con el frontend actual
          providerId: row.provider_id,
          providerName: row.provider_name,
          providerType: row.provider_type,
          cuit: row.cuit,
          contactName: row.contact_name,
          contactPhone: row.contact_phone,
          contactEmail: row.contact_email,
          creationDate: row.creation_date,
          lastUpdate: row.last_update
        };
      });
      
      return {
        providers,
        total
      };
    } catch (error) {
      console.error('Error fetching providers with user data:', error);
      throw new BadRequestException('Error al obtener la lista de proveedores');
    }
  }

  async findProviderById(id: string): Promise<any> {
    try {
      const pool = (this.userRepo as any).pool;
      
      // Buscar información completa del usuario proveedor
      const query = `
        SELECT 
          u.user_id,
          u.email,
          u.nombre,
          u.status as user_status,
          u.created_at,
          u.updated_at,
          u.last_login,
          u.email_verified,
          r.role_id,
          r.role_name,
          p.provider_id as provider_id,
          p.provider_name,
          p.provider_type,
          p.cuit,
          p.contact_name,
          p.contact_phone,
          p.contact_email,
          p.status as provider_status,
          p.creation_date as provider_creation_date,
          p.last_update as provider_last_update
        FROM proveedores p
        LEFT JOIN usuarios u ON p.user_id = u.user_id
        LEFT JOIN roles r ON u.role_id = r.role_id
        WHERE p.provider_id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
      }
      
      const userData = result.rows[0];
      
      return {
        user_id: userData.user_id,
        email: userData.email,
        nombre: userData.nombre,
        role: userData.role_id ? {
          role_id: userData.role_id,
          role_name: userData.role_name
        } : {
          role_id: null,
          role_name: 'Sin usuario asociado'
        },
        status: userData.user_status || userData.provider_status || 'active',
        created_at: userData.created_at || userData.provider_creation_date,
        updated_at: userData.updated_at || userData.provider_last_update,
        last_login: userData.last_login,
        email_verified: userData.email_verified || false,
        // Información específica del proveedor
        provider_info: {
          provider_id: userData.provider_id,
          provider_name: userData.provider_name,
          provider_type: userData.provider_type,
          cuit: userData.cuit,
          contact_name: userData.contact_name,
          contact_phone: userData.contact_phone,
          contact_email: userData.contact_email,
          provider_status: userData.provider_status,
          provider_creation_date: userData.provider_creation_date,
          provider_last_update: userData.provider_last_update
        }
      };
    } catch (error) {
      console.error('Error fetching provider by ID:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException('Error al obtener el proveedor');
    }
  }

  async findUserById(id: string): Promise<any> {
    try {
      const pool = (this.userRepo as any).pool;
      
      const query = `
        SELECT 
          u.user_id,
          u.email,
          u.nombre,
          u.status,
          u.created_at,
          u.updated_at,
          u.last_login,
          u.email_verified,
          r.role_id,
          r.role_name
        FROM usuarios u
        JOIN roles r ON u.role_id = r.role_id
        WHERE u.user_id = $1
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
      }
      
      const userData = result.rows[0];
      
      return {
        user_id: userData.user_id,
        email: userData.email,
        nombre: userData.nombre,
        role: {
          role_id: userData.role_id,
          role_name: userData.role_name
        },
        status: userData.status,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
        last_login: userData.last_login,
        email_verified: userData.email_verified
      };
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException('Error al obtener el usuario');
    }
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto, updatedBy: string): Promise<any> {
    try {
      const pool = (this.userRepo as any).pool;
      
      // Verificar que el usuario existe
      const userExistsQuery = 'SELECT user_id FROM usuarios WHERE user_id = $1';
      const userExistsResult = await pool.query(userExistsQuery, [id]);
      
      if (userExistsResult.rows.length === 0) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
      }

      // Construir la consulta de actualización dinámicamente
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (updateUserDto.email) {
        // Verificar que el email no esté en uso por otro usuario
        const emailExistsQuery = 'SELECT user_id FROM usuarios WHERE email = $1 AND user_id != $2';
        const emailExistsResult = await pool.query(emailExistsQuery, [updateUserDto.email, id]);
        
        if (emailExistsResult.rows.length > 0) {
          throw new ConflictException('El email ya está en uso por otro usuario');
        }
        
        updateFields.push(`email = $${paramIndex}`);
        updateValues.push(updateUserDto.email);
        paramIndex++;
      }

      if (updateUserDto.nombre) {
        updateFields.push(`nombre = $${paramIndex}`);
        updateValues.push(updateUserDto.nombre);
        paramIndex++;
      }

      if (updateUserDto.password) {
        // Hash de la nueva contraseña
        const hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
        updateFields.push(`password_hash = $${paramIndex}`);
        updateValues.push(hashedPassword);
        paramIndex++;
      }

      if (updateUserDto.status) {
        updateFields.push(`status = $${paramIndex}`);
        updateValues.push(updateUserDto.status);
        paramIndex++;
      }

      // Siempre actualizar updated_at y updated_by
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      if (updatedBy) {
        updateFields.push(`updated_by = $${paramIndex}`);
        updateValues.push(updatedBy);
        paramIndex++;
      }

      // Agregar el ID al final de los parámetros
      updateValues.push(id);

      const updateQuery = `
        UPDATE usuarios 
        SET ${updateFields.join(', ')}
        WHERE user_id = $${paramIndex}
        RETURNING user_id, email, nombre, status, created_at, updated_at
      `;

      const updateResult = await pool.query(updateQuery, updateValues);
      
      if (updateResult.rows.length === 0) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
      }

      // Obtener información del rol del usuario actualizado
      const userWithRoleQuery = `
        SELECT 
          u.user_id,
          u.email,
          u.nombre,
          u.status,
          u.created_at,
          u.updated_at,
          r.role_id,
          r.role_name
        FROM usuarios u
        JOIN roles r ON u.role_id = r.role_id
        WHERE u.user_id = $1
      `;

      const userWithRoleResult = await pool.query(userWithRoleQuery, [id]);
      const userData = userWithRoleResult.rows[0];

      return {
        user_id: userData.user_id,
        email: userData.email,
        nombre: userData.nombre,
        role: {
          role_id: userData.role_id,
          role_name: userData.role_name
        },
        status: userData.status,
        created_at: userData.created_at,
        updated_at: userData.updated_at
      };
    } catch (error) {
      console.error('Error updating user:', error);
      
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      
      throw new BadRequestException('Error al actualizar el usuario');
    }
  }

  async updateProvider(id: string, updateData: Partial<CreateProviderDto>, updatedBy: string): Promise<any> {
    try {
      const pool = (this.userRepo as any).pool;
      
      // Obtener información completa del proveedor actual
      const providerData = await this.findProviderById(id);
      
      if (!providerData || !providerData.provider_info) {
        throw new NotFoundException(`Proveedor con ID ${id} no encontrado`);
      }

      let newUserId = providerData.user_id;

      // Si el proveedor no tiene user_id asociado, crear un nuevo usuario
      if (!providerData.user_id && (updateData.email || updateData.nombre || updateData.status)) {
        console.log('Proveedor legacy sin user_id - creando nuevo usuario asociado');
        
        // Verificar que el email no esté en uso si se proporciona
        if (updateData.email) {
          const emailExistsQuery = 'SELECT user_id FROM usuarios WHERE email = $1';
          const emailExistsResult = await pool.query(emailExistsQuery, [updateData.email]);
          
          if (emailExistsResult.rows.length > 0) {
            throw new ConflictException('El email ya está en uso por otro usuario');
          }
        }

        // Obtener el role_id para "Proveedor" (role_id = 3)
        const roleQuery = 'SELECT role_id FROM roles WHERE role_name = $1';
        const roleResult = await pool.query(roleQuery, ['Proveedor']);
        
        if (roleResult.rows.length === 0) {
          throw new BadRequestException('Rol "Proveedor" no encontrado en la base de datos');
        }
        
        const roleId = roleResult.rows[0].role_id;

        // Generar nuevo user_id y contraseña
        newUserId = require('crypto').randomUUID();
        const tempPassword = this.generateRandomPassword();
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // Crear el nuevo usuario
        const createUserQuery = `
          INSERT INTO usuarios (
            user_id, 
            email, 
            nombre, 
            password_hash, 
            role_id, 
            status, 
            email_verified, 
            created_at, 
            updated_at, 
            created_by
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9)
        `;

        const createUserParams = [
          newUserId,
          updateData.email || `proveedor_${providerData.provider_info.provider_id}@temp.com`, // Email temporal si no se proporciona
          updateData.nombre || providerData.provider_info.provider_name || 'Proveedor Legacy',
          hashedPassword,
          roleId,
          updateData.status || 'active',
          false, // email_verified
          new Date(),
          updatedBy
        ];
        
        await pool.query(createUserQuery, createUserParams);
        
        // Asociar el nuevo usuario al proveedor
        const linkUserQuery = `
          UPDATE proveedores 
          SET user_id = $1, last_update = CURRENT_TIMESTAMP
          WHERE provider_id = $2
        `;
        
        await pool.query(linkUserQuery, [newUserId, providerData.provider_info.provider_id]);
        
        console.log(`Usuario creado y asociado al proveedor. User ID: ${newUserId}, Contraseña temporal: ${tempPassword}`);
      }
      // Si el proveedor YA tiene user_id asociado, actualizar el usuario existente
      else if (providerData.user_id) {
        const userUpdateFields: string[] = [];
        const userUpdateValues: any[] = [];
        let userParamIndex = 1;

        if (updateData.email) {
          // Verificar que el email no esté en uso por otro usuario
          const emailExistsQuery = 'SELECT user_id FROM usuarios WHERE email = $1 AND user_id != $2';
          const emailExistsResult = await pool.query(emailExistsQuery, [updateData.email, providerData.user_id]);
          
          if (emailExistsResult.rows.length > 0) {
            throw new ConflictException('El email ya está en uso por otro usuario');
          }
          
          userUpdateFields.push(`email = $${userParamIndex}`);
          userUpdateValues.push(updateData.email);
          userParamIndex++;
        }

        if (updateData.nombre) {
          userUpdateFields.push(`nombre = $${userParamIndex}`);
          userUpdateValues.push(updateData.nombre);
          userParamIndex++;
        }

        if (updateData.status) {
          userUpdateFields.push(`status = $${userParamIndex}`);
          userUpdateValues.push(updateData.status);
          userParamIndex++;
        }

        // Actualizar tabla usuarios si hay cambios
        if (userUpdateFields.length > 0) {
          userUpdateFields.push(`updated_at = CURRENT_TIMESTAMP`);
          if (updatedBy) {
            userUpdateFields.push(`updated_by = $${userParamIndex}`);
            userUpdateValues.push(updatedBy);
            userParamIndex++;
          }

          userUpdateValues.push(providerData.user_id);
          
          const userUpdateQuery = `
            UPDATE usuarios 
            SET ${userUpdateFields.join(', ')}
            WHERE user_id = $${userParamIndex}
          `;

          await pool.query(userUpdateQuery, userUpdateValues);
        }
      }

      // Actualizar información específica del proveedor si se proporciona
      const providerUpdateFields: string[] = [];
      const providerUpdateValues: any[] = [];
      let providerParamIndex = 1;

      if (updateData.provider_name) {
        providerUpdateFields.push(`provider_name = $${providerParamIndex}`);
        providerUpdateValues.push(updateData.provider_name);
        providerParamIndex++;
      }

      if (updateData.provider_type) {
        providerUpdateFields.push(`provider_type = $${providerParamIndex}`);
        providerUpdateValues.push(updateData.provider_type);
        providerParamIndex++;
      }

      if (updateData.cuit) {
        // Verificar que el CUIT no esté en uso por otro proveedor
        const cuitExistsQuery = 'SELECT provider_id FROM proveedores WHERE cuit = $1 AND provider_id != $2';
        const cuitExistsResult = await pool.query(cuitExistsQuery, [updateData.cuit, providerData.provider_info.provider_id]);
        
        if (cuitExistsResult.rows.length > 0) {
          throw new ConflictException('El CUIT ya está en uso por otro proveedor');
        }
        
        providerUpdateFields.push(`cuit = $${providerParamIndex}`);
        providerUpdateValues.push(updateData.cuit);
        providerParamIndex++;
      }

      if (updateData.contact_name) {
        providerUpdateFields.push(`contact_name = $${providerParamIndex}`);
        providerUpdateValues.push(updateData.contact_name);
        providerParamIndex++;
      }

      if (updateData.contact_phone) {
        providerUpdateFields.push(`contact_phone = $${providerParamIndex}`);
        providerUpdateValues.push(updateData.contact_phone);
        providerParamIndex++;
      }

      if (updateData.contact_email) {
        providerUpdateFields.push(`contact_email = $${providerParamIndex}`);
        providerUpdateValues.push(updateData.contact_email);
        providerParamIndex++;
      }

      // Actualizar tabla proveedores si hay cambios
      if (providerUpdateFields.length > 0) {
        providerUpdateFields.push(`last_update = CURRENT_TIMESTAMP`);
        if (updatedBy) {
          providerUpdateFields.push(`updated_by = $${providerParamIndex}`);
          providerUpdateValues.push(updatedBy);
          providerParamIndex++;
        }

        providerUpdateValues.push(providerData.provider_info.provider_id);
        
        const providerUpdateQuery = `
          UPDATE proveedores 
          SET ${providerUpdateFields.join(', ')}
          WHERE provider_id = $${providerParamIndex}
        `;

        await pool.query(providerUpdateQuery, providerUpdateValues);
      }

      // Devolver los datos actualizados
      return await this.findProviderById(id);
      
    } catch (error) {
      console.error('Error updating provider:', error);
      
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      
      throw new BadRequestException('Error al actualizar el proveedor');
    }
  }

  async updateUserPermissions(id: string, updatePermissionsDto: UpdateUserPermissionsDto): Promise<Usuario> {
    // TODO: Implementar cuando se tenga la tabla usuarios completa y sistema de permisos
    throw new BadRequestException('User permissions functionality needs full permissions system implementation');
  }

  async bulkUpdateUsers(bulkUpdateDto: BulkUpdateUsersDto): Promise<{ updated: number }> {
    // TODO: Implementar cuando se tenga la tabla usuarios completa
    throw new BadRequestException('Bulk user update functionality needs full usuarios table implementation');
  }

  async deleteUser(id: string): Promise<void> {
    try {
      const pool = (this.userRepo as any).pool;
      
      // Verificar que el usuario existe antes de intentar eliminarlo
      const userExistsQuery = 'SELECT user_id FROM usuarios WHERE user_id = $1';
      const userExistsResult = await pool.query(userExistsQuery, [id]);
      
      if (userExistsResult.rows.length === 0) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
      }
      
      // En lugar de eliminar físicamente, marcar como inactivo (soft delete)
      // Esto es más seguro para mantener la integridad referencial
      const softDeleteQuery = `
        UPDATE usuarios 
        SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
      `;
      
      await pool.query(softDeleteQuery, [id]);
      
      // Si necesitas eliminar físicamente (usar con cuidado):
      // const deleteQuery = 'DELETE FROM usuarios WHERE user_id = $1';
      // await pool.query(deleteQuery, [id]);
    } catch (error) {
      console.error('Error deleting user:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException('Error al eliminar el usuario');
    }
  }

  async deleteProvider(id: string): Promise<void> {
    const provider = await this.findProviderById(id);
    await this.providerRepository.delete(id);
  }

  async getUserStats(): Promise<any> {
    try {
      const pool = (this.userRepo as any).pool;
      
      // Obtener el conteo total de usuarios y por rol
      const statsQuery = `
        SELECT 
          COUNT(*) as total,
          r.role_name,
          COUNT(u.user_id) as role_count
        FROM usuarios u
        JOIN roles r ON u.role_id = r.role_id
        WHERE u.status = 'active'
        GROUP BY r.role_name
      `;
      
      const statsResult = await pool.query(statsQuery);
      
      // Obtener el total general
      const totalQuery = `
        SELECT COUNT(*) as total 
        FROM usuarios 
        WHERE status = 'active'
      `;
      
      const totalResult = await pool.query(totalQuery);
      const total = parseInt(totalResult.rows[0].total);
      
      // Construir el objeto by_role
      const byRole: Record<string, number> = {};
      statsResult.rows.forEach((row: any) => {
        byRole[row.role_name] = parseInt(row.role_count);
      });
      
      return {
        total,
        by_role: byRole,
        message: 'User statistics retrieved successfully'
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      
      // Fallback a estadísticas de proveedores si hay error
      const providerCount = await this.providerRepository.count();
      
      return {
        total: providerCount,
        by_role: {
          'Proveedor': providerCount
        },
        message: 'Limited stats - only providers available due to database error'
      };
    }
  }

  private generateRandomPassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }

  async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      // Obtener los permisos del usuario desde la base de datos
      const userPermissions = await this.userRepo.getUserPermissions(userId);
      
      // Verificar si el usuario tiene el permiso específico requerido
      const hasSpecificPermission = userPermissions.includes(permission);
      
      // También verificar si tiene acceso de administrador general (que debería tener todos los permisos)
      const hasAdminAccess = userPermissions.includes('ADMIN_ACCESS');
      
      return hasSpecificPermission || hasAdminAccess;
    } catch (error) {
      console.error(`Error checking permissions for user ${userId}:`, error);
      return false;
    }
  }

  async findAllAuditors(page: number = 1, limit: number = 10): Promise<{ auditors: any[], total: number }> {
    try {
      const pool = (this.userRepo as any).pool;
      
      // Primero intentar consulta con auditor_info
      let query = `
        SELECT 
          u.user_id,
          u.email,
          u.nombre,
          u.status,
          u.created_at,
          u.updated_at,
          u.last_login,
          u.email_verified,
          u.auditor_info,
          r.role_id,
          r.role_name
        FROM usuarios u
        JOIN roles r ON u.role_id = r.role_id
        WHERE r.role_name = 'Auditor'
        ORDER BY u.created_at DESC
        LIMIT $1 OFFSET $2
      `;
      
      let auditorsResult;
      try {
        const offset = (page - 1) * limit;
        auditorsResult = await pool.query(query, [limit, offset]);
      } catch (columnError) {
        // Si falla, probablemente auditor_info no existe, usar consulta básica
        console.log('⚠️ Campo auditor_info no encontrado en findAllAuditors, usando consulta básica');
        query = `
          SELECT 
            u.user_id,
            u.email,
            u.nombre,
            u.status,
            u.created_at,
            u.updated_at,
            u.last_login,
            u.email_verified,
            r.role_id,
            r.role_name
          FROM usuarios u
          JOIN roles r ON u.role_id = r.role_id
          WHERE r.role_name = 'Auditor'
          ORDER BY u.created_at DESC
          LIMIT $1 OFFSET $2
        `;
        
        const offset = (page - 1) * limit;
        auditorsResult = await pool.query(query, [limit, offset]);
      }
      
      // Consulta para obtener el total de auditores (sin auditor_info para compatibilidad)
      const countQuery = `
        SELECT COUNT(*) as total
        FROM usuarios u
        JOIN roles r ON u.role_id = r.role_id
        WHERE r.role_name = 'Auditor'
      `;
      
      const countResult = await pool.query(countQuery);
      const total = parseInt(countResult.rows[0].total);
      
      // Mapear resultados al formato esperado, incluyendo auditor_info si está disponible
      const auditors = auditorsResult.rows.map((row: any) => {
        // Parsear información específica del auditor si existe
        let auditorInfo = {};
        if (row.auditor_info) {
          try {
            auditorInfo = JSON.parse(row.auditor_info);
          } catch (error) {
            console.log('⚠️ Error parsing auditor_info JSON for auditor:', row.user_id, error);
            auditorInfo = {};
          }
        }
        
        return {
          user_id: row.user_id,
          email: row.email,
          nombre: row.nombre,
          role: {
            role_id: row.role_id,
            role_name: row.role_name
          },
          status: row.status || 'active',
          created_at: row.created_at,
          updated_at: row.updated_at,
          last_login: row.last_login,
          email_verified: row.email_verified || false,
          // Información específica del auditor
          auditor_info: auditorInfo
        };
      });
      
      return {
        auditors,
        total
      };
    } catch (error) {
      console.error('Error fetching auditors:', error);
      throw new BadRequestException('Error al obtener la lista de auditores');
    }
  }

  async findAuditorById(id: string): Promise<any> {
    try {
      const pool = (this.userRepo as any).pool;
      
      // Primero intentar buscar con auditor_info
      let query = `
        SELECT 
          u.user_id,
          u.email,
          u.nombre,
          u.status,
          u.created_at,
          u.updated_at,
          u.last_login,
          u.email_verified,
          u.auditor_info,
          r.role_id,
          r.role_name
        FROM usuarios u
        JOIN roles r ON u.role_id = r.role_id
        WHERE u.user_id = $1 AND r.role_name = 'Auditor'
      `;
      
      let result;
      try {
        result = await pool.query(query, [id]);
      } catch (columnError) {
        // Si falla, probablemente auditor_info no existe, usar consulta básica
        console.log('⚠️ Campo auditor_info no encontrado, usando consulta básica');
        query = `
          SELECT 
            u.user_id,
            u.email,
            u.nombre,
            u.status,
            u.created_at,
            u.updated_at,
            u.last_login,
            u.email_verified,
            r.role_id,
            r.role_name
          FROM usuarios u
          JOIN roles r ON u.role_id = r.role_id
          WHERE u.user_id = $1 AND r.role_name = 'Auditor'
        `;
        
        result = await pool.query(query, [id]);
      }
      
      if (result.rows.length === 0) {
        console.log('❌ Auditor no encontrado con ID:', id);
        throw new NotFoundException(`Auditor con ID ${id} no encontrado`);
      }
      
      const row = result.rows[0];
      console.log('✅ Auditor encontrado:', row.email);
      
      // Parsear información específica del auditor si existe
      let auditorInfo = {};
      if (row.auditor_info) {
        try {
          auditorInfo = JSON.parse(row.auditor_info);
        } catch (error) {
          console.log('⚠️ Error parsing auditor_info:', error);
          auditorInfo = {};
        }
      }

      // Obtener obras sociales asociadas
      let healthcareProviders = [];
      try {
        const obrasSocialesIds = await this.getAuditorObrasSociales(id);
        if (obrasSocialesIds.length > 0) {
          const obrasSocialesQuery = `
            SELECT healthcare_provider_id, name, status, contact_phone, contact_email, address
            FROM obras_sociales 
            WHERE healthcare_provider_id = ANY($1)
          `;
          const obrasSocialesResult = await pool.query(obrasSocialesQuery, [obrasSocialesIds]);
          healthcareProviders = obrasSocialesResult.rows.map(obra => ({
            healthcareProviderId: obra.healthcare_provider_id,
            name: obra.name,
            status: obra.status,
            contactPhone: obra.contact_phone,
            contactEmail: obra.contact_email,
            address: obra.address
          }));
        }
      } catch (error) {
        console.log('⚠️ Error loading healthcare providers for auditor:', error);
      }
      
      return {
        user_id: row.user_id,
        email: row.email,
        nombre: row.nombre,
        role: {
          role_id: row.role_id,
          role_name: row.role_name
        },
        status: row.status || 'active',
        created_at: row.created_at,
        updated_at: row.updated_at,
        last_login: row.last_login,
        email_verified: row.email_verified || false,
        // Información específica del auditor
        auditor_info: auditorInfo,
        // Obras sociales asociadas
        healthcareProviders: healthcareProviders
      };
      
    } catch (error) {
      console.error('Error finding auditor by ID:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException('Error al buscar el auditor');
    }
  }

  async updateAuditor(id: string, updateData: UpdateAuditorDto, updatedBy: string): Promise<any> {
    try {
      const pool = (this.userRepo as any).pool;
      
      // Verificar que el auditor existe
      const auditorData = await this.findAuditorById(id);
      
      if (!auditorData) {
        throw new NotFoundException(`Auditor con ID ${id} no encontrado`);
      }

      // Actualizar información básica del usuario
      const userUpdateFields: string[] = [];
      const userUpdateValues: any[] = [];
      let userParamIndex = 1;

      if (updateData.email) {
        // Verificar que el email no esté en uso por otro usuario
        const emailExistsQuery = 'SELECT user_id FROM usuarios WHERE email = $1 AND user_id != $2';
        const emailExistsResult = await pool.query(emailExistsQuery, [updateData.email, id]);
        
        if (emailExistsResult.rows.length > 0) {
          throw new ConflictException('El email ya está en uso por otro usuario');
        }
        
        userUpdateFields.push(`email = $${userParamIndex}`);
        userUpdateValues.push(updateData.email);
        userParamIndex++;
      }

      if (updateData.nombre) {
        userUpdateFields.push(`nombre = $${userParamIndex}`);
        userUpdateValues.push(updateData.nombre);
        userParamIndex++;
      }

      if (updateData.status) {
        userUpdateFields.push(`status = $${userParamIndex}`);
        userUpdateValues.push(updateData.status);
        userParamIndex++;
      }

      // Actualizar tabla usuarios si hay cambios
      if (userUpdateFields.length > 0) {
        userUpdateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        if (updatedBy) {
          userUpdateFields.push(`updated_by = $${userParamIndex}`);
          userUpdateValues.push(updatedBy);
          userParamIndex++;
        }

        userUpdateValues.push(id);
        
        const userUpdateQuery = `
          UPDATE usuarios 
          SET ${userUpdateFields.join(', ')}
          WHERE user_id = $${userParamIndex}
        `;

        await pool.query(userUpdateQuery, userUpdateValues);
      }

      // Verificar si hay cambios específicos del auditor
      let hasAuditorSpecificChanges = false;
      const auditorSpecificData: any = {};

      if (updateData.first_name !== undefined) {
        auditorSpecificData.first_name = updateData.first_name;
        hasAuditorSpecificChanges = true;
      }
      if (updateData.last_name !== undefined) {
        auditorSpecificData.last_name = updateData.last_name;
        hasAuditorSpecificChanges = true;
      }
      if (updateData.phone !== undefined) {
        auditorSpecificData.phone = updateData.phone;
        hasAuditorSpecificChanges = true;
      }
      if (updateData.department !== undefined) {
        auditorSpecificData.department = updateData.department;
        hasAuditorSpecificChanges = true;
      }
      if (updateData.employee_id !== undefined) {
        auditorSpecificData.employee_id = updateData.employee_id;
        hasAuditorSpecificChanges = true;
      }
      if (updateData.permissions !== undefined) {
        auditorSpecificData.permissions = updateData.permissions;
        hasAuditorSpecificChanges = true;
      }

      // Si hay cambios específicos del auditor, los guardamos en un campo JSON en usuarios
      if (hasAuditorSpecificChanges) {
        console.log('📝 Guardando información específica del auditor:', auditorSpecificData);
        
        // Verificar si ya existe información de auditor en usuarios
        let currentInfo = {};
        let hasAuditorInfoColumn = false;
        
        try {
          const currentAuditorInfoQuery = `
            SELECT auditor_info 
            FROM usuarios 
            WHERE user_id = $1
          `;
          
          const currentInfoResult = await pool.query(currentAuditorInfoQuery, [id]);
          hasAuditorInfoColumn = true;
          
          if (currentInfoResult.rows.length > 0 && currentInfoResult.rows[0].auditor_info) {
            currentInfo = JSON.parse(currentInfoResult.rows[0].auditor_info);
          }
        } catch (error) {
          console.log('🔧 Campo auditor_info no existe, intentando agregar...');
          hasAuditorInfoColumn = false;
          
          try {
            await pool.query(`
              ALTER TABLE usuarios 
              ADD COLUMN auditor_info TEXT
            `);
            console.log('✅ Campo auditor_info agregado exitosamente');
            hasAuditorInfoColumn = true;
          } catch (alterError) {
            console.log('⚠️ No se pudo agregar el campo auditor_info:', alterError.message);
            hasAuditorInfoColumn = false;
          }
        }

        // Solo intentar actualizar si tenemos la columna disponible
        if (hasAuditorInfoColumn) {
          // Combinar información existente con nueva información
          const updatedInfo = { ...currentInfo, ...auditorSpecificData };

          try {
            const updateAuditorInfoQuery = `
              UPDATE usuarios 
              SET auditor_info = $1, updated_at = CURRENT_TIMESTAMP
              WHERE user_id = $2
            `;
            
            await pool.query(updateAuditorInfoQuery, [JSON.stringify(updatedInfo), id]);
            console.log('✅ Información específica del auditor guardada exitosamente');
          } catch (jsonUpdateError) {
            console.log('⚠️ Error guardando auditor_info:', jsonUpdateError.message);
            // Continuar sin error para no romper la funcionalidad básica
          }
        } else {
          console.log('⚠️ No se puede guardar información específica del auditor - columna no disponible');
          console.log('📋 Datos que se habrían guardado:', auditorSpecificData);
        }
      }

      // Manejar asociaciones de obras sociales si se proporcionaron
      if (updateData.healthcare_providers !== undefined) {
        console.log('🏥 Actualizando obras sociales del auditor:', updateData.healthcare_providers);
        
        try {
          // Obtener las obras sociales actuales
          const currentObrasSociales = await this.getAuditorObrasSociales(id);
          console.log('📋 Obras sociales actuales:', currentObrasSociales);
          console.log('🔄 Nuevas obras sociales:', updateData.healthcare_providers);
          
          // Determinar qué obras sociales agregar y cuáles eliminar
          const newObrasSociales = updateData.healthcare_providers || [];
          const toAdd = newObrasSociales.filter(osId => !currentObrasSociales.includes(osId));
          const toRemove = currentObrasSociales.filter(osId => !newObrasSociales.includes(osId));
          
          console.log('➕ Obras sociales a agregar:', toAdd);
          console.log('➖ Obras sociales a eliminar:', toRemove);
          
          // Agregar nuevas asociaciones
          for (const obraSocialId of toAdd) {
            await this.associateAuditorWithObraSocial(id, obraSocialId, updatedBy || 'system');
            console.log(`✅ Asociado con obra social: ${obraSocialId}`);
          }
          
          // Eliminar asociaciones
          for (const obraSocialId of toRemove) {
            await this.dissociateAuditorFromObraSocial(id, obraSocialId);
            console.log(`❌ Desasociado de obra social: ${obraSocialId}`);
          }
          
          console.log('🏥 Obras sociales actualizadas exitosamente');
        } catch (error) {
          console.error('❌ Error actualizando obras sociales:', error);
          // No lanzar error para no romper la actualización de otros campos
          console.log('⚠️ Continuando con la actualización a pesar del error en obras sociales');
        }
      }

      // Devolver los datos actualizados
      return await this.findAuditorById(id);
      
    } catch (error) {
      console.error('Error updating auditor:', error);
      
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      
      throw new BadRequestException('Error al actualizar el auditor');
    }
  }

  async deleteAuditor(id: string): Promise<void> {
    try {
      const pool = (this.userRepo as any).pool;
      
      // Verificar que el auditor existe
      const auditorData = await this.findAuditorById(id);
      
      if (!auditorData) {
        throw new NotFoundException(`Auditor con ID ${id} no encontrado`);
      }
      
      // Soft delete - marcar como inactivo en lugar de eliminar físicamente
      const softDeleteQuery = `
        UPDATE usuarios 
        SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
      `;
      
      await pool.query(softDeleteQuery, [id]);
      
    } catch (error) {
      console.error('Error deleting auditor:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException('Error al eliminar el auditor');
    }
  }

  // ==================== EFECTORES ====================

  async findAllEffectors(page: number = 1, limit: number = 10): Promise<{ effectors: any[], total: number }> {
    try {
      const pool = (this.userRepo as any).pool;
      
      const offset = (page - 1) * limit;
      
      console.log('🏥 Buscando efectores - Página:', page, 'Límite:', limit, 'Offset:', offset);
      
      // Primero intentar consulta con effector_info
      let query = `
        SELECT 
          u.user_id,
          u.email,
          u.nombre,
          u.status,
          u.created_at,
          u.updated_at,
          u.last_login,
          u.email_verified,
          u.effector_info,
          r.role_id,
          r.role_name
        FROM usuarios u
        JOIN roles r ON u.role_id = r.role_id
        WHERE r.role_name = 'Efector'
        ORDER BY u.created_at DESC
        LIMIT $1 OFFSET $2
      `;
      
      let effectorsResult;
      try {
        effectorsResult = await pool.query(query, [limit, offset]);
      } catch (columnError) {
        // Si falla, probablemente effector_info no existe, usar consulta básica
        console.log('⚠️ Campo effector_info no encontrado en findAllEffectors, usando consulta básica');
        query = `
          SELECT 
            u.user_id,
            u.email,
            u.nombre,
            u.status,
            u.created_at,
            u.updated_at,
            u.last_login,
            u.email_verified,
            r.role_id,
            r.role_name
          FROM usuarios u
          JOIN roles r ON u.role_id = r.role_id
          WHERE r.role_name = 'Efector'
          ORDER BY u.created_at DESC
          LIMIT $1 OFFSET $2
        `;
        
        effectorsResult = await pool.query(query, [limit, offset]);
      }
      
      console.log('🏥 Efectores encontrados:', effectorsResult.rows.length);
      
      // Consulta para contar el total (sin effector_info para compatibilidad)
      const countQuery = `
        SELECT COUNT(*) as total
        FROM usuarios u
        JOIN roles r ON u.role_id = r.role_id
        WHERE r.role_name = 'Efector'
      `;
      
      const countResult = await pool.query(countQuery);
      const total = parseInt(countResult.rows[0].total);
      console.log('📊 Total de efectores:', total);
      
      // Mapear resultados al formato esperado, incluyendo effector_info si está disponible
      const effectors = effectorsResult.rows.map((row: any) => {
        // Parsear información específica del efector si existe
        let effectorInfo = {};
        if (row.effector_info) {
          try {
            effectorInfo = JSON.parse(row.effector_info);
          } catch (error) {
            console.log('⚠️ Error parsing effector_info JSON for effector:', row.user_id, error);
            effectorInfo = {};
          }
        }
        
        return {
          user_id: row.user_id,
          email: row.email,
          nombre: row.nombre,
          role: {
            role_id: row.role_id,
            role_name: row.role_name
          },
          status: row.status,
          created_at: row.created_at,
          updated_at: row.updated_at,
          last_login: row.last_login,
          email_verified: row.email_verified,
          // Información específica del efector
          effector_info: effectorInfo
        };
      });
      
      return {
        effectors,
        total
      };
      
    } catch (error) {
      console.error('Error fetching effectors:', error);
      throw new BadRequestException('Error al obtener los efectores');
    }
  }

  async findEffectorById(id: string): Promise<any> {
    try {
      const pool = (this.userRepo as any).pool;
      
      console.log('🔍 Buscando efector por ID:', id);
      
      // Primero intentar buscar con effector_info
      let query = `
        SELECT 
          u.user_id,
          u.email,
          u.nombre,
          u.status,
          u.created_at,
          u.updated_at,
          u.last_login,
          u.email_verified,
          u.effector_info,
          r.role_id,
          r.role_name
        FROM usuarios u
        JOIN roles r ON u.role_id = r.role_id
        WHERE u.user_id = $1 AND r.role_name = 'Efector'
      `;
      
      let result;
      try {
        result = await pool.query(query, [id]);
      } catch (columnError) {
        // Si falla, probablemente effector_info no existe, usar consulta básica
        console.log('⚠️ Campo effector_info no encontrado, usando consulta básica');
        query = `
          SELECT 
            u.user_id,
            u.email,
            u.nombre,
            u.status,
            u.created_at,
            u.updated_at,
            u.last_login,
            u.email_verified,
            r.role_id,
            r.role_name
          FROM usuarios u
          JOIN roles r ON u.role_id = r.role_id
          WHERE u.user_id = $1 AND r.role_name = 'Efector'
        `;
        
        result = await pool.query(query, [id]);
      }
      
      if (result.rows.length === 0) {
        console.log('❌ Efector no encontrado con ID:', id);
        throw new NotFoundException(`Efector con ID ${id} no encontrado`);
      }
      
      const row = result.rows[0];
      console.log('✅ Efector encontrado:', row.email);
      
      let effector_info = null;
      
      if (row.effector_info) {
        try {
          effector_info = JSON.parse(row.effector_info);
        } catch (error) {
          console.log('⚠️ Error parsing effector_info:', error);
          effector_info = {};
        }
      }
      
      // Obtener obras sociales asociadas
      let healthcareProviders = [];
      try {
        const obrasSocialesIds = await this.getEffectorObrasSociales(id);
        if (obrasSocialesIds.length > 0) {
          const obrasSocialesQuery = `
            SELECT healthcare_provider_id, name, status, contact_phone, contact_email, address
            FROM obras_sociales 
            WHERE healthcare_provider_id = ANY($1)
          `;
          const obrasSocialesResult = await pool.query(obrasSocialesQuery, [obrasSocialesIds]);
          healthcareProviders = obrasSocialesResult.rows.map(obra => ({
            healthcareProviderId: obra.healthcare_provider_id,
            name: obra.name,
            status: obra.status,
            contactPhone: obra.contact_phone,
            contactEmail: obra.contact_email,
            address: obra.address
          }));
        }
      } catch (error) {
        console.log('⚠️ Error loading healthcare providers for effector:', error);
      }
      
      return {
        user_id: row.user_id,
        email: row.email,
        nombre: row.nombre,
        role: {
          role_id: row.role_id,
          role_name: row.role_name
        },
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        last_login: row.last_login,
        email_verified: row.email_verified || false,
        effector_info: effector_info,
        // Obras sociales asociadas
        healthcareProviders: healthcareProviders
      };
      
    } catch (error) {
      console.error('Error finding effector by ID:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException('Error al buscar el efector');
    }
  }

  async updateEffector(id: string, updateData: any, updatedBy: string): Promise<any> {
    try {
      const pool = (this.userRepo as any).pool;
      
      console.log('📝 Actualizando efector:', id);
      console.log('📋 Datos a actualizar:', updateData);
      
      // Verificar que el efector existe
      const effectorData = await this.findEffectorById(id);
      
      if (!effectorData) {
        throw new NotFoundException(`Efector con ID ${id} no encontrado`);
      }

      // Actualizar información básica del usuario
      const userUpdateFields: string[] = [];
      const userUpdateValues: any[] = [];
      let userParamIndex = 1;

      if (updateData.email) {
        // Verificar que el email no esté en uso por otro usuario
        const emailExistsQuery = 'SELECT user_id FROM usuarios WHERE email = $1 AND user_id != $2';
        const emailExistsResult = await pool.query(emailExistsQuery, [updateData.email, id]);
        
        if (emailExistsResult.rows.length > 0) {
          throw new ConflictException('El email ya está en uso por otro usuario');
        }
        
        userUpdateFields.push(`email = $${userParamIndex}`);
        userUpdateValues.push(updateData.email);
        userParamIndex++;
      }

      if (updateData.nombre) {
        userUpdateFields.push(`nombre = $${userParamIndex}`);
        userUpdateValues.push(updateData.nombre);
        userParamIndex++;
      }

      if (updateData.status) {
        userUpdateFields.push(`status = $${userParamIndex}`);
        userUpdateValues.push(updateData.status);
        userParamIndex++;
      }

      // Actualizar tabla usuarios si hay cambios
      if (userUpdateFields.length > 0) {
        userUpdateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        if (updatedBy) {
          userUpdateFields.push(`updated_by = $${userParamIndex}`);
          userUpdateValues.push(updatedBy);
          userParamIndex++;
        }

        userUpdateValues.push(id);
        
        const userUpdateQuery = `
          UPDATE usuarios 
          SET ${userUpdateFields.join(', ')}
          WHERE user_id = $${userParamIndex}
        `;

        await pool.query(userUpdateQuery, userUpdateValues);
      }

      // Verificar si hay cambios específicos del efector
      let hasEffectorSpecificChanges = false;
      const effectorSpecificData: any = {};

      if (updateData.effector_name !== undefined) {
        effectorSpecificData.effector_name = updateData.effector_name;
        hasEffectorSpecificChanges = true;
      }
      if (updateData.effector_type !== undefined) {
        effectorSpecificData.effector_type = updateData.effector_type;
        hasEffectorSpecificChanges = true;
      }
      if (updateData.cuit !== undefined) {
        effectorSpecificData.cuit = updateData.cuit;
        hasEffectorSpecificChanges = true;
      }
      if (updateData.contact_name !== undefined) {
        effectorSpecificData.contact_name = updateData.contact_name;
        hasEffectorSpecificChanges = true;
      }
      if (updateData.contact_phone !== undefined) {
        effectorSpecificData.contact_phone = updateData.contact_phone;
        hasEffectorSpecificChanges = true;
      }
      if (updateData.contact_email !== undefined) {
        effectorSpecificData.contact_email = updateData.contact_email;
        hasEffectorSpecificChanges = true;
      }
      if (updateData.address !== undefined) {
        effectorSpecificData.address = updateData.address;
        hasEffectorSpecificChanges = true;
      }

      // Si hay cambios específicos del efector, los guardamos en un campo JSON en usuarios
      if (hasEffectorSpecificChanges) {
        console.log('📝 Guardando información específica del efector:', effectorSpecificData);
        
        // Verificar si ya existe información de efector en usuarios
        let currentInfo = {};
        let hasEffectorInfoColumn = false;
        
        try {
          const currentEffectorInfoQuery = `
            SELECT effector_info 
            FROM usuarios 
            WHERE user_id = $1
          `;
          
          const currentInfoResult = await pool.query(currentEffectorInfoQuery, [id]);
          hasEffectorInfoColumn = true;
          
          if (currentInfoResult.rows.length > 0 && currentInfoResult.rows[0].effector_info) {
            currentInfo = JSON.parse(currentInfoResult.rows[0].effector_info);
          }
        } catch (error) {
          console.log('🔧 Campo effector_info no existe, intentando agregar...');
          hasEffectorInfoColumn = false;
          
          try {
            await pool.query(`
              ALTER TABLE usuarios 
              ADD COLUMN effector_info TEXT
            `);
            console.log('✅ Campo effector_info agregado exitosamente');
            hasEffectorInfoColumn = true;
          } catch (alterError) {
            console.log('⚠️ No se pudo agregar el campo effector_info:', alterError.message);
            hasEffectorInfoColumn = false;
          }
        }

        // Solo intentar actualizar si tenemos la columna disponible
        if (hasEffectorInfoColumn) {
          // Combinar información existente con nueva información
          const updatedInfo = { ...currentInfo, ...effectorSpecificData };

          try {
            const updateEffectorInfoQuery = `
              UPDATE usuarios 
              SET effector_info = $1, updated_at = CURRENT_TIMESTAMP
              WHERE user_id = $2
            `;
            
            await pool.query(updateEffectorInfoQuery, [JSON.stringify(updatedInfo), id]);
            console.log('✅ Información específica del efector guardada exitosamente');
          } catch (jsonUpdateError) {
            console.log('⚠️ Error guardando effector_info:', jsonUpdateError.message);
            // Continuar sin error para no romper la funcionalidad básica
          }
        } else {
          console.log('⚠️ No se puede guardar información específica del efector - columna no disponible');
          console.log('📋 Datos que se habrían guardado:', effectorSpecificData);
        }
      }

      // Manejar asociaciones de obras sociales si se proporcionaron
      if (updateData.healthcare_providers !== undefined) {
        console.log('🏥 Actualizando obras sociales del efector:', updateData.healthcare_providers);
        
        try {
          // Obtener las obras sociales actuales
          const currentObrasSociales = await this.getEffectorObrasSociales(id);
          console.log('📋 Obras sociales actuales:', currentObrasSociales);
          console.log('🔄 Nuevas obras sociales:', updateData.healthcare_providers);
          
          // Determinar qué obras sociales agregar y cuáles eliminar
          const newObrasSociales = updateData.healthcare_providers || [];
          const toAdd = newObrasSociales.filter(osId => !currentObrasSociales.includes(osId));
          const toRemove = currentObrasSociales.filter(osId => !newObrasSociales.includes(osId));
          
          console.log('➕ Obras sociales a agregar:', toAdd);
          console.log('➖ Obras sociales a eliminar:', toRemove);
          
          // Agregar nuevas asociaciones
          for (const obraSocialId of toAdd) {
            await this.associateEffectorWithObraSocial(id, obraSocialId, updatedBy || 'system');
            console.log(`✅ Asociado con obra social: ${obraSocialId}`);
          }
          
          // Eliminar asociaciones
          for (const obraSocialId of toRemove) {
            await this.dissociateEffectorFromObraSocial(id, obraSocialId);
            console.log(`❌ Desasociado de obra social: ${obraSocialId}`);
          }
          
          console.log('🏥 Obras sociales actualizadas exitosamente');
        } catch (error) {
          console.error('❌ Error actualizando obras sociales:', error);
          // No lanzar error para no romper la actualización de otros campos
          console.log('⚠️ Continuando con la actualización a pesar del error en obras sociales');
        }
      }

      // Devolver los datos actualizados
      return await this.findEffectorById(id);
      
    } catch (error) {
      console.error('Error updating effector:', error);
      
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      
      throw new BadRequestException('Error al actualizar el efector');
    }
  }

  async deleteEffector(id: string): Promise<void> {
    const pool = (this.userRepo as any).pool;
    
    try {
      console.log('🗑️ Iniciando eliminación del efector:', id);
      
      // Verificar que el usuario sea un efector
      const userResult = await pool.query(`
        SELECT u.user_id, r.role_name 
        FROM usuarios u
        JOIN roles r ON u.role_id = r.role_id
        WHERE u.user_id = $1 AND r.role_name = 'Efector'
      `, [id]);

      if (userResult.rows.length === 0) {
        throw new NotFoundException('Efector not found');
      }

      // Eliminar el efector (el cascade manejará las relaciones)
      const deleteResult = await pool.query('DELETE FROM usuarios WHERE user_id = $1', [id]);
      
      if (deleteResult.rowCount === 0) {
        throw new NotFoundException('Efector not found');
      }
      
      console.log('✅ Efector eliminado exitosamente');
    } catch (error) {
      console.error('❌ Error deleting effector:', error);
      throw error;
    }
  }

  // ==================== MÉTODOS AUXILIARES PARA OBRAS SOCIALES ====================

  async getAuditorObrasSociales(auditorUserId: string): Promise<string[]> {
    const pool = (this.userRepo as any).pool;
    try {
      const result = await pool.query(`
        SELECT healthcare_provider_id 
        FROM auditores_obras_sociales 
        WHERE auditor_user_id = $1 AND association_status = 'active'
      `, [auditorUserId]);
      return result.rows.map(row => row.healthcare_provider_id);
    } catch (error) {
      console.error('Error getting auditor obras sociales:', error);
      return [];
    }
  }

  async getEffectorObrasSociales(effectorUserId: string): Promise<string[]> {
    const pool = (this.userRepo as any).pool;
    try {
      const result = await pool.query(`
        SELECT healthcare_provider_id 
        FROM efectores_obras_sociales 
        WHERE effector_user_id = $1 AND association_status = 'active'
      `, [effectorUserId]);
      return result.rows.map(row => row.healthcare_provider_id);
    } catch (error) {
      console.error('Error getting effector obras sociales:', error);
      return [];
    }
  }

  async associateAuditorWithObraSocial(auditorUserId: string, healthcareProviderId: string, createdBy: string): Promise<void> {
    const pool = (this.userRepo as any).pool;
    try {
      await pool.query(`
        INSERT INTO auditores_obras_sociales (auditor_user_id, healthcare_provider_id, created_by)
        VALUES ($1, $2, $3)
        ON CONFLICT (auditor_user_id, healthcare_provider_id) 
        DO UPDATE SET association_status = 'active', association_date = CURRENT_TIMESTAMP
      `, [auditorUserId, healthcareProviderId, createdBy]);
    } catch (error) {
      console.error('Error associating auditor with obra social:', error);
      throw error;
    }
  }

  async associateEffectorWithObraSocial(effectorUserId: string, healthcareProviderId: string, createdBy: string): Promise<void> {
    const pool = (this.userRepo as any).pool;
    try {
      await pool.query(`
        INSERT INTO efectores_obras_sociales (effector_user_id, healthcare_provider_id, created_by)
        VALUES ($1, $2, $3)
        ON CONFLICT (effector_user_id, healthcare_provider_id) 
        DO UPDATE SET association_status = 'active', association_date = CURRENT_TIMESTAMP
      `, [effectorUserId, healthcareProviderId, createdBy]);
    } catch (error) {
      console.error('Error associating effector with obra social:', error);
      throw error;
    }
  }

  async dissociateAuditorFromObraSocial(auditorUserId: string, healthcareProviderId: string): Promise<void> {
    const pool = (this.userRepo as any).pool;
    try {
      await pool.query(`
        UPDATE auditores_obras_sociales 
        SET association_status = 'inactive' 
        WHERE auditor_user_id = $1 AND healthcare_provider_id = $2
      `, [auditorUserId, healthcareProviderId]);
    } catch (error) {
      console.error('Error dissociating auditor from obra social:', error);
      throw error;
    }
  }

  async dissociateEffectorFromObraSocial(effectorUserId: string, healthcareProviderId: string): Promise<void> {
    const pool = (this.userRepo as any).pool;
    try {
      await pool.query(`
        UPDATE efectores_obras_sociales 
        SET association_status = 'inactive' 
        WHERE effector_user_id = $1 AND healthcare_provider_id = $2
      `, [effectorUserId, healthcareProviderId]);
    } catch (error) {
      console.error('Error dissociating effector from obra social:', error);
      throw error;
    }
  }
} 