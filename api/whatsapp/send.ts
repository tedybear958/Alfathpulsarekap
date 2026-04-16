import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { target, message } = req.body;
  const apiKey = process.env.FONNTE_API_KEY;

  // Clean target: remove any non-digit characters except comma
  const cleanTarget = target ? String(target).replace(/[^\d,]/g, '') : '';

  if (!apiKey) {
    console.error('FONNTE_API_KEY is missing in environment variables');
    return res.status(500).json({ error: 'FONNTE_API_KEY is not configured' });
  }

  try {
    console.log('Sending to Fonnte:', { target: cleanTarget, messageLength: message?.length });
    
    const response = await axios.post(
      'https://api.fonnte.com/send',
      {
        target: cleanTarget,
        message,
        countryCode: '62', // Default to Indonesia
      },
      {
        headers: {
          Authorization: apiKey.trim(),
        },
        timeout: 10000, // 10s timeout
      }
    );
    
    console.log('Fonnte Response:', response.data);
    return res.status(200).json(response.data);
  } catch (error: any) {
    const errorData = error.response?.data;
    const errorMessage = error.message;
    
    console.error('Fonnte API Error Details:', {
      status: error.response?.status,
      data: errorData,
      message: errorMessage
    });

    return res.status(error.response?.status || 500).json({ 
      error: 'Failed to send WhatsApp message', 
      details: errorData || errorMessage,
      success: false
    });
  }
}
