import { checkDBConnection } from '../../lib/db';
import { verifyTransporter } from '../../lib/email';

export default async function handler(req, res) {
  try {
    // Veritabanı bağlantısını kontrol et
    const dbConnected = await checkDBConnection();
    
    // E-posta sunucusu bağlantısını kontrol et
    const emailConnected = await verifyTransporter();
    
    // Sonuçları döndür
    res.status(200).json({
      dbConnected,
      emailConnected,
      env: {
        dbHost: process.env.MYSQL_HOST ? "Ayarlandı" : "Eksik",
        emailConfig: process.env.EMAIL_SERVER_HOST ? "Ayarlandı" : "Eksik"
      }
    });
  } catch (error) {
    console.error('Bağlantı kontrolü hatası:', error);
    res.status(500).json({ 
      error: 'Bağlantı kontrolü sırasında hata oluştu',
      message: error.message 
    });
  }
}