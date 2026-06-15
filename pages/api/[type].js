import { kv } from '@vercel/kv';

const ALLOWED = ['customers', 'caregivers'];

export default async function handler(req, res) {
  const { type } = req.query;

  if (!ALLOWED.includes(type)) {
    return res.status(400).json({ error: 'Invalid type' });
  }

  const key = `cgmap_${type}`;

  try {
    if (req.method === 'GET') {
      const data = (await kv.get(key)) ?? [];
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      // req.body is already parsed as JSON by Next.js
      await kv.set(key, req.body);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(`KV error [${type}]:`, err);
    return res.status(500).json({ error: 'Storage unavailable' });
  }
}
