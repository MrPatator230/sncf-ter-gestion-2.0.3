import pool from '../../../utils/db';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'PUT') {
    const { name, type, imageData } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }
    try {
      await pool.query(
        'UPDATE materiels_roulants SET name = ?, type = ?, image_data = ?, updated_at = NOW() WHERE id = ?',
        [name, type, imageData || null, id]
      );
      res.status(200).json({ message: 'Materiel roulant updated successfully' });
    } catch (error) {
      console.error('Error updating materiel roulant:', error);
      res.status(500).json({ error: 'Failed to update materiel roulant' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await pool.query('DELETE FROM materiels_roulants WHERE id = ?', [id]);
      res.status(200).json({ message: 'Materiel roulant deleted successfully' });
    } catch (error) {
      console.error('Error deleting materiel roulant:', error);
      res.status(500).json({ error: 'Failed to delete materiel roulant' });
    }
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
