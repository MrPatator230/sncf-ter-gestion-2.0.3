import pool from '../../../utils/db';

export default async function handler(req, res) {
  const { id } = req.query;

    if (req.method === 'PUT') {
      const {
        trainNumber,
        departureStation,
        arrivalStation,
        arrivalTime,
        departureTime,
        trainType,
        rollingStockFileName,
        composition,
        joursCirculation,
        servedStations,
      } = req.body;

      if (!trainNumber || !departureStation || !arrivalStation || !arrivalTime || !departureTime || !trainType) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      try {
        // Ensure stations exist
        const stationsToCheck = [departureStation, arrivalStation];
        if (Array.isArray(servedStations)) {
          servedStations.forEach(s => {
            if (s.name) stationsToCheck.push(s.name);
          });
        }
        for (const stationName of stationsToCheck) {
          const [existing] = await pool.query('SELECT id FROM stations WHERE name = ?', [stationName]);
          if (existing.length === 0) {
            await pool.query('INSERT INTO stations (name) VALUES (?)', [stationName]);
          }
        }

        await pool.query(
          `UPDATE schedules SET 
            train_number = ?, 
            departure_station = ?, 
            arrival_station = ?, 
            arrival_time = ?, 
            departure_time = ?, 
            train_type = ?, 
            rolling_stock_file_name = ?, 
            composition = ?, 
            jours_circulation = ?, 
            served_stations = ?,
            updated_at = NOW() 
            WHERE id = ?`,
          [
            trainNumber,
            departureStation,
            arrivalStation,
            arrivalTime,
            departureTime,
            trainType,
            rollingStockFileName || null,
            JSON.stringify(composition || []),
            JSON.stringify(joursCirculation || []),
            JSON.stringify(servedStations || []),
            id,
          ]
        );
        res.status(200).json({ message: 'Schedule updated successfully' });
      } catch (error) {
        console.error('Error updating schedule:', error);
        res.status(500).json({ error: 'Failed to update schedule' });
      }
    } else if (req.method === 'DELETE') {
    try {
      await pool.query('DELETE FROM schedules WHERE id = ?', [id]);
      res.status(200).json({ message: 'Schedule deleted successfully' });
    } catch (error) {
      console.error('Error deleting schedule:', error);
      res.status(500).json({ error: 'Failed to delete schedule' });
    }
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
