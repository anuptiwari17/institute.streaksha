const { createClient } = require('redis');

const isCloud = !!process.env.REDIS_PASSWORD; 
// if password exists → assume cloud

const redis = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    ...(isCloud ? { tls: true } : {}), // enable TLS only for cloud
  },
  ...(isCloud ? { password: process.env.REDIS_PASSWORD } : {}),
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('ready', () => console.log('🚀 Redis ready'));
redis.on('error', (err) => console.error('❌ Redis error:', err));

async function connectRedis() {
  if (!redis.isOpen) {
    await redis.connect();
  }
}

connectRedis();

module.exports = redis;