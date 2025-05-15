import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateProveedoresTable1684115789000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'proveedores',
        columns: [
          {
            name: 'provider_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'provider_name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'provider_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'cuit',
            type: 'varchar',
            length: '20',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'contact_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'contact_phone',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'contact_email',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'creation_date',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'last_update',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
            isUnique: true,
          },
        ],
      }),
      true,
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      'proveedores',
      new TableForeignKey({
        name: 'fk_proveedores_user',
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'usuarios',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('proveedores', 'fk_proveedores_user');
    await queryRunner.dropTable('proveedores');
  }
} 