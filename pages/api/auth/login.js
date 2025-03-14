import { query } from '../../../lib/db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { sendVerificationEmail } from '../../../lib/email';
import { setAuthCookie } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { emailOrUsername, password, rememberMe } = req.body;

  try {
    // Find user by email or username
    const users = await query(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [emailOrUsername, emailOrUsername]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Geçersiz giriş bilgileri' });
    }

    const user = users[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Geçersiz giriş bilgileri' });
    }

    // If user is not verified, generate new verification code and send email
    if (!user.is_verified) {
      try {
        // Generate verification code (6 digit number)
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationCodeExpires = new Date(Date.now() + 3600000); // 1 hour

        console.log(`Sending verification code ${verificationCode} to ${user.email}`);

        // Update verification code in database
        await query(
          'UPDATE users SET verification_code = ?, verification_code_expires = ? WHERE id = ?',
          [verificationCode, verificationCodeExpires, user.id]
        );

        // Send verification email
        await sendVerificationEmail(user.email, verificationCode);

        return res.status(200).json({ 
          message: 'Hesabınızı doğrulamanız gerekiyor. Doğrulama kodunu e-posta adresinize gönderdik.',
          requiresVerification: true,
          email: user.email  // Always return the email from the database
        });
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        return res.status(500).json({ message: 'Doğrulama kodu gönderilirken bir hata oluştu.' });
      }
    }

    // User is verified, create session
    const sessionToken = uuidv4();
    const sessionExpires = new Date(Date.now() + (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000); // 30 days or 1 day

    await query(
      'INSERT INTO sessions (token, user_id, expires) VALUES (?, ?, ?)',
      [sessionToken, user.id, sessionExpires]
    );

    // Set auth cookie
    setAuthCookie(res, sessionToken, rememberMe);

    // Return user data (excluding password)
    const { password: _, verification_code: __, verification_code_expires: ___, ...userData } = user;

    res.status(200).json({ 
      user: userData,
      message: 'Giriş başarılı'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
}