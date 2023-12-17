import { NODE_ENV } from '@/config';
import { PrismaClient } from '@prisma/client';
import { Service } from 'typedi';

@Service()
export class PrismaClientService extends PrismaClient implements PrismaClient {
  constructor() {
    super({
      log: NODE_ENV === 'development' ? ['query', 'error', 'warn', 'info'] : ['error', 'warn'],
    });
  }

  public async initializePrisma(): Promise<void> {
    await this.$connect();
  }
}
