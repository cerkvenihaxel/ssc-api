import { MagicLink } from '../../models/magiclink/magic-link.model';

export interface IMagicLinkRepository {
  findById(magicLinkId: string): Promise<MagicLink | null>;
  findByToken(token: string): Promise<MagicLink | null>;
  findActiveByUserId(userId: string): Promise<MagicLink[]>;
  save(magicLink: MagicLink): Promise<MagicLink>;
  update(magicLink: MagicLink): Promise<MagicLink>;
} 