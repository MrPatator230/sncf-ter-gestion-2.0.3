import pool from '../../../utils/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const [rows] = await pool.query('SELECT * FROM gestion_horaires');
      res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching gestion_horaires:', error);
      res.status(500).json({ error: 'Failed to fetch gestion_horaires' });
    }
  } else if (req.method === 'POST') {
    const { schedule_id, delay_minutes, is_cancelled, track_assignments } = req.body;
    if (!schedule_id) {
      return res.status(400).json({ error: 'schedule_id is required' });
    }
    try {
      const [existing] = await pool.query('SELECT id FROM gestion_horaires WHERE schedule_id = ?', [schedule_id]);
      if (existing.length > 0) {
        await pool.query(
          'UPDATE gestion_horaires SET delay_minutes = ?, is_cancelled = ?, track_assignments = ?, updated_at = NOW() WHERE schedule_id = ?',
          [delay_minutes || 0, is_cancelled || false, JSON.stringify(track_assignments || {}), schedule_id]
        );
      } else {
        await pool.query(
          'INSERT INTO gestion_horaires (schedule_id, delay_minutes, is_cancelled, track_assignments) VALUES (?, ?, ?, ?)',
          [schedule_id, delay_minutes || 0, is_cancelled || false, JSON.stringify(track_assignments || {})]
        );
      }
      res.status(200).json({ message: 'Gestion horaire saved successfully' });
    } catch (error) {
      console.error('Error saving gestion_horaire:', error);
      res.status(500).json({ error: 'Failed to save gestion_horaire' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
