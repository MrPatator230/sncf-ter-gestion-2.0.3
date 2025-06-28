import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

export default function StationSchedule() {
  const router = useRouter();
  const { station } = router.query;

  const [scheduleType, setScheduleType] = useState('departures');
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSchedules = async () => {
      if (!station) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/schedules/by-station?station=${encodeURIComponent(station)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch schedules');
        }
        const data = await response.json();
        setSchedules(data);
      } catch (err) {
        setError(err.message);
        setSchedules([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [station]);

  const filteredSchedules = schedules.filter(schedule => {
    if (scheduleType === 'departures') {
      return schedule.departureStation === station || (schedule.servedStations && schedule.servedStations.some(s => s.name === station && s.departureTime));
    } else {
      return schedule.arrivalStation === station || (schedule.servedStations && schedule.servedStations.some(s => s.name === station && s.arrivalTime));
    }
  });

  return (
    <Layout>
      <div className="container py-4">
        <h1>Horaires pour la gare: {station}</h1>

        <div className="btn-group mb-3">
          <button
            className={`btn btn-${scheduleType === 'departures' ? 'primary' : 'secondary'}`}
            onClick={() => setScheduleType('departures')}
          >
            Départs
          </button>
          <button
            className={`btn btn-${scheduleType === 'arrivals' ? 'primary' : 'secondary'}`}
            onClick={() => setScheduleType('arrivals')}
          >
            Arrivées
          </button>
        </div>

        {loading && <p>Chargement des horaires...</p>}
        {error && <p className="text-danger">Erreur: {error}</p>}

        {!loading && !error && filteredSchedules.length === 0 && (
          <p>Aucun horaire trouvé pour cette gare et ce type.</p>
        )}

        {!loading && !error && filteredSchedules.length > 0 && (
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Heure</th>
                <th>Train</th>
                <th>Destination</th>
                <th>Voie</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.map(schedule => {
                const time = scheduleType === 'departures'
                  ? (schedule.departureStation === station ? schedule.departureTime : schedule.servedStations?.find(s => s.name === station)?.departureTime)
                  : (schedule.arrivalStation === station ? schedule.arrivalTime : schedule.servedStations?.find(s => s.name === station)?.arrivalTime);

                const destination = scheduleType === 'departures' ? schedule.arrivalStation : schedule.departureStation;

                const status = schedule.isCancelled ? 'Supprimé' : (schedule.delayMinutes ? `Retard ${schedule.delayMinutes} min` : 'À l\'heure');

                return (
                  <tr key={schedule.id}>
                    <td>{time || '-'}</td>
                    <td>{schedule.trainNumber}</td>
                    <td>{destination}</td>
                    <td>{schedule.track || '-'}</td>
                    <td>{status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
