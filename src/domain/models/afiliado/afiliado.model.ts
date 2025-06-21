import { randomUUID } from 'crypto';
import { Address } from './address.model';

// UUID especial para representar acciones del sistema
const SYSTEM_UUID = '00000000-0000-0000-0000-000000000000';

export class Afiliado {
  constructor(
    public readonly id: string,
    public readonly affiliateNumber: string,
    public readonly affiliateStatus: string,
    public readonly creationDate: Date,
    public readonly lastUpdate: Date,
    public readonly cuil: string,
    public readonly cvu: string | null,
    public readonly documentType: string,
    public readonly documentNumber: string,
    public readonly documentCountry: string,
    public readonly gender: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly birthDate: Date,
    public readonly nationality: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly occupation: string | null,
    public readonly phone: string | null,
    public readonly picture: string | null,
    public readonly signedTycVersion: string | null,
    public readonly signedTycDate: Date | null,
    public readonly primaryAddressId: string | null,
    public readonly createdBy: string,
    public readonly updatedBy: string | null,
    public readonly addresses?: Address[]
  ) {}

  static create(params: {
    street: string;
    number?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    afiliadoId?: string;
    addresses?: Address[];
  }): Afiliado {
    const now = new Date();
    return new Afiliado(
      params.afiliadoId || randomUUID(),
      '',  // affiliateNumber
      'ACTIVE',  // affiliateStatus
      now,  // creationDate
      now,  // lastUpdate
      '',  // cuil
      null,  // cvu
      'DNI',  // documentType
      '',  // documentNumber
      'AR',  // documentCountry
      '',  // gender
      '',  // firstName
      '',  // lastName
      now,  // birthDate
      'AR',  // nationality
      '',  // email
      '',  // passwordHash
      null,  // occupation
      null,  // phone
      null,  // picture
      null,  // signedTycVersion
      null,  // signedTycDate
      null,  // primaryAddressId
      SYSTEM_UUID,  // createdBy - UUID especial para el sistema
      null,  // updatedBy
      params.addresses
    );
  }
} 