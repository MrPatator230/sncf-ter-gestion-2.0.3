import pool from '../../../utils/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const [rows] = await pool.query('SELECT * FROM materiels_roulants ORDER BY created_at DESC');
      res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching materiels roulants:', error);
      res.status(500).json({ error: 'Failed to fetch materiels roulants' });
    }
  } else if (req.method === 'POST') {
    const { name, type, imageData } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }
    try {
      const [result] = await pool.query(
        'INSERT INTO materiels_roulants (name, type, image_data) VALUES (?, ?, ?)',
        [name, type, imageData || null]
      );
      res.status(201).json({ id: result.insertId, name, type, imageData });
    } catch (error) {
      console.error('Error creating materiel roulant:', error);
      res.status(500).json({ error: 'Failed to create materiel roulant' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
