import pool from '../../../utils/db';

export default async function handler(req, res) {
  const { station } = req.query;

  if (!station) {
    return res.status(400).json({ error: 'Station parameter is required' });
  }

  try {
    // Query to get schedules where the station is departureStation, arrivalStation, or in servedStations
    // Assuming servedStations is stored as JSON array of objects with a 'name' property
    const query = `
      SELECT * FROM schedules
      WHERE departureStation = ?
         OR arrivalStation = ?
         OR JSON_CONTAINS(
           JSON_EXTRACT(servedStations, '$[*].name'),
           JSON_QUOTE(?)
         )
    `;

    const [rows] = await pool.query(query, [station, station, station]);

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching schedules by station:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
