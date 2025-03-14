import { query } from '../../../lib/db';
import { sendVerificationEmail } from '../../../lib/email';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // Find user by email
    const users = await query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      // Don't reveal that the email doesn't exist
      return res.status(200).json({ message: 'If your email exists, we sent you a verification code' });
    }

    const user = users[0];

    // Generate verification code (6 digit number)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpires = new Date(Date.now() + 3600000); // 1 hour

    // Update verification code in database
    await query(
      'UPDATE users SET verification_code = ?, verification_code_expires = ? WHERE id = ?',
      [verificationCode, verificationCodeExpires, user.id]
    );

    // Send verification email
    await sendVerificationEmail(email, verificationCode);

    res.status(200).json({ 
      message: 'Yeni doğrulama kodu e-posta adresinize gönderildi.'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
}