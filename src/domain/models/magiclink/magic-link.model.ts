import { randomBytes, randomUUID } from 'crypto';

export class MagicLink {
  constructor(
    public readonly magicLinkId: string,
    public readonly userId: string,
    public readonly token: string,
    public readonly createdAt: Date,
    public readonly expiresAt: Date,
    public readonly usedAt?: Date,
    public readonly usedIp?: string,
    public readonly userAgent?: string,
    public readonly requestedIp?: string,
    public readonly requestUserAgent?: string,
    public readonly isActive: boolean = true
  ) {}

  static create(
    userId: string,
    requestedIp: string,
    requestUserAgent: string,
    expirationMinutes: number = 15,
    magicLinkId?: string,
    createdAt?: Date
  ): MagicLink {
    const now = createdAt || new Date();
    const expiresAt = new Date(now.getTime() + expirationMinutes * 60000);
    const token = randomBytes(32).toString('hex');

    return new MagicLink(
      magicLinkId || randomUUID(),
      userId,
      token,
      now,
      expiresAt,
      undefined,
      undefined,
      undefined,
      requestedIp,
      requestUserAgent,
      true
    );
  }

  isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  isUsed(): boolean {
    return !!this.usedAt;
  }

  isValid(): boolean {
    return this.isActive && !this.isExpired() && !this.isUsed();
  }

  markAsUsed(usedIp: string, userAgent: string): MagicLink {
    return new MagicLink(
      this.magicLinkId,
      this.userId,
      this.token,
      this.createdAt,
      this.expiresAt,
      new Date(),
      usedIp,
      userAgent,
      this.requestedIp,
      this.requestUserAgent,
      false
    );
  }
} 