/**
 * Redis 7+ клиент для кэширования и сессий (стек: Redis 7+).
 * Опционально: если REDIS_URL не задан, кэш не используется.
 */

const REDIS_URL = process.env.REDIS_URL;

export type RedisClient = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, ttlSeconds?: number) => Promise<void>;
  del: (key: string) => Promise<void>;
};

let client: RedisClient | null = null;
let redisInstance: any = null;
let isConnected = false;

async function getRedis(): Promise<RedisClient | null> {
  if (!REDIS_URL) return null;
  
  // Если клиент существует и подключен, возвращаем его
  if (client && isConnected) return client;
  
  try {
    const { createClient } = await import('redis');
    
    // Если был старый экземпляр, пытаемся его отключить
    if (redisInstance) {
      try {
        await redisInstance.disconnect();
      } catch (e) {
        // молча игнорируем ошибку отключения
      }
    }
    
    const r = createClient({ 
      url: REDIS_URL,
      socket: { reconnectStrategy: (retries: number) => Math.min(retries * 50, 500) },
    });
    
    // Обработчик ошибок для автоматического отключения при потере соединения
    r.on('error', (err: Error) => {
      console.error('Redis error:', err.message);
      isConnected = false;
      client = null;
      redisInstance = null;
    });
    
    r.on('close', () => {
      isConnected = false;
      client = null;
      redisInstance = null;
    });
    
    await r.connect();
    isConnected = true;
    redisInstance = r;
    
    client = {
      async get(key: string) {
        try {
          return await r.get(key);
        } catch (e) {
          console.error('Redis get error:', e);
          isConnected = false;
          client = null;
          redisInstance = null;
          return null;
        }
      },
      async set(key: string, value: string, ttlSeconds?: number) {
        try {
          await r.set(key, value, ttlSeconds ? { EX: ttlSeconds } : undefined);
        } catch (e) {
          console.error('Redis set error:', e);
          isConnected = false;
          client = null;
          redisInstance = null;
        }
      },
      async del(key: string) {
        try {
          await r.del(key);
        } catch (e) {
          console.error('Redis del error:', e);
          isConnected = false;
          client = null;
          redisInstance = null;
        }
      },
    };
    return client;
  } catch (e) {
    console.error('Failed to connect to Redis:', e);
    isConnected = false;
    return null;
  }
}

export async function redisGet(key: string): Promise<string | null> {
  const r = await getRedis();
  return r ? r.get(key) : null;
}

export async function redisSet(key: string, value: string, ttlSeconds?: number): Promise<void> {
  const r = await getRedis();
  if (r) await r.set(key, value, ttlSeconds);
}

export async function redisDel(key: string): Promise<void> {
  const r = await getRedis();
  if (r) await r.del(key);
}
