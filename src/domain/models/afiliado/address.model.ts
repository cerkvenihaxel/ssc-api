export class Address {
  constructor(
    public readonly id: string,
    public readonly affiliateId: string,
    public readonly street: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly number?: string,
    public readonly city?: string,
    public readonly state?: string,
    public readonly postalCode?: string,
    public readonly country: string = 'Argentina'
  ) {}
} 