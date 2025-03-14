import { getUserFromToken, getTokenFromCookies } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Get token from cookies
  const token = getTokenFromCookies(req);
  
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  // Get user from token
  const user = await getUserFromToken(token);

  if (!user) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  // Return user data
  res.status(200).json(user);
}