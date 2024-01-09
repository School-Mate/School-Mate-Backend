import { REDIS_URL } from '@/config';
import { logger } from '@/utils/logger';
import { RedisClientType, SetOptions, createClient } from 'redis';
import { Service } from 'typedi';

@Service()
export class RedisClientService {
  public client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: REDIS_URL,
    });

    this.client.on('error', error => {
      logger.error(error);
    });

    this.client.on('ready', () => {
      logger.info('Redis is ready');
    });

    this.client.on('connect', () => {
      logger.info('Redis is connected');
    });
  }

  public async initializeRedis(): Promise<void> {
    await this.client.connect();
  }

  public async get<T>(key: string): Promise<T> {
    const data = await this.client.get(key);

    return JSON.parse(data);
  }

  public async set(key: string, value: string, options?: SetOptions): Promise<void> {
    await this.client.set(key, JSON.stringify(value), options);
  }

  public async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  public async flush(): Promise<void> {
    await this.client.flushAll();
  }

  public async has(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }
}
