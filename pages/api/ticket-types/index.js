import pool from '../../../utils/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const [rows] = await pool.query('SELECT * FROM ticket_types ORDER BY created_at DESC');
      res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching ticket types:', error);
      res.status(500).json({ error: 'Failed to fetch ticket types' });
    }
  } else if (req.method === 'POST') {
    const { name, price, category } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Name, price, and category are required' });
    }
    try {
      const [result] = await pool.query(
        'INSERT INTO ticket_types (name, price, category) VALUES (?, ?, ?)',
        [name, price, category]
      );
      res.status(201).json({ id: result.insertId, name, price, category });
    } catch (error) {
      console.error('Error creating ticket type:', error);
      res.status(500).json({ error: 'Failed to create ticket type' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
