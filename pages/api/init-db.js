import { initDB } from '../../lib/db';

export default async function handler(req, res) {
  try {
    await initDB();
    res.status(200).json({ message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    res.status(500).json({ error: 'Failed to initialize database' });
  }
}