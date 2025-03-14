import { query } from '../../../lib/db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { sendVerificationEmail } from '../../../lib/email';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { username, email, password } = req.body;

  try {
    // Check if email already exists
    const emailCheckResult = await query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (emailCheckResult.length > 0) {
      return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanılıyor' });
    }

    // Check if username already exists
    const usernameCheckResult = await query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (usernameCheckResult.length > 0) {
      return res.status(400).json({ message: 'Bu kullanıcı adı zaten kullanılıyor' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification code (6 digit number)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpires = new Date(Date.now() + 3600000); // 1 hour

    // Create user
    const result = await query(
      `INSERT INTO users (
        id, 
        username, 
        email, 
        password, 
        verification_code, 
        verification_code_expires, 
        is_verified, 
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        username,
        email,
        hashedPassword,
        verificationCode,
        verificationCodeExpires,
        false,
        new Date()
      ]
    );

    // Send verification email
    await sendVerificationEmail(email, verificationCode);

    res.status(201).json({ 
      message: 'Kayıt başarılı. Doğrulama kodunu e-posta adresinize gönderdik.',
      email
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
}