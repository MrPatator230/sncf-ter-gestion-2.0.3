import pool from '../../utils/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    let connection;
    try {
      connection = await pool.getConnection();
      const [stations] = await connection.query('SELECT * FROM stations ORDER BY id ASC');
      const [categories] = await connection.query('SELECT * FROM station_categories');

      // Map categories to stations
      const stationCategoriesMap = {};
      categories.forEach(cat => {
        if (!stationCategoriesMap[cat.station_id]) {
          stationCategoriesMap[cat.station_id] = [];
        }
        stationCategoriesMap[cat.station_id].push(cat.category);
      });

      const stationsWithCategories = stations.map(station => ({
        id: station.id,
        name: station.name,
        locationType: station.locationType || 'Ville',
        categories: stationCategoriesMap[station.id] || []
      }));

      res.status(200).json(stationsWithCategories);
    } catch (error) {
      console.error('Error fetching stations:', error);
      res.status(500).json({ error: 'Failed to fetch stations' });
    } finally {
      if (connection) connection.release();
    }
  } else if (req.method === 'POST') {
    const stations = req.body;
    if (!Array.isArray(stations)) {
      return res.status(400).json({ error: 'Invalid stations data' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Clear existing stations and categories
      await connection.query('DELETE FROM station_categories');
      await connection.query('DELETE FROM stations');

      // Insert new stations and categories
      for (const station of stations) {
        const [result] = await connection.query('INSERT INTO stations (name, locationType) VALUES (?, ?)', [station.name, station.locationType || 'Ville']);
        const stationId = result.insertId;
        if (Array.isArray(station.categories)) {
          for (const category of station.categories) {
            await connection.query('INSERT INTO station_categories (station_id, category) VALUES (?, ?)', [stationId, category]);
          }
        }
      }

      await connection.commit();
      res.status(200).json({ message: 'Stations saved successfully' });
    } catch (error) {
      await connection.rollback();
      console.error('Error saving stations:', error);
      res.status(500).json({ error: 'Failed to save stations' });
    } finally {
      connection.release();
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
