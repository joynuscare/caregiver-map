import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv(); // reads UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN

const ALLOWED = ['customers', 'caregivers'];

export default async function handler(req, res) {
  const { type } = req.query;

  if (!ALLOWED.includes(type)) {
    return res.status(400).json({ error: 'Invalid type' });
  }

  const key = `cgmap_${type}`;

  try {
    if (req.method === 'GET') {
      const data = (await redis.get(key)) ?? [];
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      await redis.set(key, req.body);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(`Redis error [${type}]:`, err);
    return res.status(500).json({ error: 'Storage unavailable' });
  }
}
