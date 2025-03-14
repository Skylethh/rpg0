import { query } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract verification data from request body
    const { code, email } = req.body;
    
    // Validate required parameters
    if (!code || !email) {
      return res.status(400).json({ 
        error: 'Verification code and email are required' 
      });
    }

    // Make sure we're passing actual values (not undefined)
    const result = await query(
      'UPDATE users SET is_verified = 1, verification_code = NULL WHERE email = ? AND verification_code = ?',
      [email || null, code || null] // Convert any undefined values to null
    );

    // Check if verification was successful
    if (result.affectedRows === 0) {
      return res.status(400).json({ 
        error: 'Invalid verification code or email' 
      });
    }

    // Return success response
    return res.status(200).json({ 
      success: true, 
      message: 'Account verified successfully' 
    });
  } catch (error) {
    console.error('Verification error:', error);
    return res.status(500).json({ 
      error: 'Server error during verification' 
    });
  }
}