import axios from 'axios';

export const sendWhatsAppMessage = async (target: string, message: string) => {
  try {
    const response = await axios.post('/api/whatsapp/send', {
      target,
      message,
    });
    return response.data;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
};
