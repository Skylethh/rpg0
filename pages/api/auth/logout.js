import { clearAuthCookie } from '../../../lib/auth';
import { query } from '../../../lib/db';
import { getTokenFromCookies } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get token from cookies
  const token = getTokenFromCookies(req);
  
  if (token) {
    try {
      // Delete session from database
      await query('DELETE FROM sessions WHERE token = ?', [token]);
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }

  // Clear auth cookie
  clearAuthCookie(res);

  res.status(200).json({ message: 'Çıkış yapıldı' });
}