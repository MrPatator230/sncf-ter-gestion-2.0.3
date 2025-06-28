import pool from '../../../utils/db';

export default async function handler(req, res) {
  // Ignore station and type parameters, return all schedules
  try {
    const query = 'SELECT * FROM schedules';
    const [rows] = await pool.query(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching all schedules:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
