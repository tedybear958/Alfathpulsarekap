import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { target, message } = req.body;
  const apiKey = process.env.FONNTE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'FONNTE_API_KEY is not configured' });
  }

  try {
    const response = await axios.post(
      'https://api.fonnte.com/send',
      {
        target,
        message,
      },
      {
        headers: {
          Authorization: apiKey,
        },
      }
    );
    return res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Fonnte API Error:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to send WhatsApp message' });
  }
}
