import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

export default function StationSchedule() {
  const router = useRouter();
  const { station } = router.query;

  const [departures, setDepartures] = useState([]);
  const [arrivals, setArrivals] = useState([]);
  const [loadingDepartures, setLoadingDepartures] = useState(false);
  const [loadingArrivals, setLoadingArrivals] = useState(false);
  const [errorDepartures, setErrorDepartures] = useState(null);
  const [errorArrivals, setErrorArrivals] = useState(null);

  useEffect(() => {
    const fetchSchedules = async () => {
      if (!station) return;
      setLoadingDepartures(true);
      setErrorDepartures(null);
      setLoadingArrivals(true);
      setErrorArrivals(null);
      try {
        const response = await fetch(`/api/schedules/by-station`);
        if (!response.ok) {
          throw new Error('Failed to fetch schedules');
        }
        const data = await response.json();
        // Filter departures and arrivals client-side
        console.log('Fetched schedules:', data);
        console.log('Filtering for station:', station);
        const normalize = (str) => str?.trim().toLowerCase();
        const normalizedStation = normalize(station);
        setDepartures(data.filter(schedule =>
          normalize(schedule.departureStation) === normalizedStation ||
          (Array.isArray(schedule.servedStations) && schedule.servedStations.some(s => normalize(s.name) === normalizedStation && s.departureTime))
        ));
        setArrivals(data.filter(schedule =>
          normalize(schedule.arrivalStation) === normalizedStation ||
          (Array.isArray(schedule.servedStations) && schedule.servedStations.some(s => normalize(s.name) === normalizedStation && s.arrivalTime))
        ));
      } catch (err) {
        setErrorDepartures(err.message);
        setErrorArrivals(err.message);
        setDepartures([]);
        setArrivals([]);
      } finally {
        setLoadingDepartures(false);
        setLoadingArrivals(false);
      }
    };

    fetchSchedules();
  }, [station]);

  return (
    <Layout>
      <div className="container py-4">
        <h1>Horaires pour la gare: {station}</h1>

        {loadingDepartures && <p>Chargement des départs...</p>}
        {errorDepartures && <p className="text-danger">Erreur départs: {errorDepartures}</p>}

        {!loadingDepartures && !errorDepartures && departures.length === 0 && (
          <p>Aucun départ trouvé pour cette gare.</p>
        )}

        {!loadingDepartures && !errorDepartures && departures.length > 0 && (
          <>
            <h2>Départs</h2>
            <table className="table table-striped mb-4">
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
                {departures.map(schedule => {
                  const normalize = (str) => str?.trim().toLowerCase();
                  const normalizedStation = normalize(station);
                  let time = schedule.departureTime;
                  if (normalize(schedule.departureStation) !== normalizedStation && Array.isArray(schedule.servedStations)) {
                    const served = schedule.servedStations.find(s => normalize(s.name) === normalizedStation);
                    if (served && served.departureTime) {
                      time = served.departureTime;
                    }
                  }
                  const destination = schedule.arrivalStation;
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
          </>
        )}

        {loadingArrivals && <p>Chargement des arrivées...</p>}
        {errorArrivals && <p className="text-danger">Erreur arrivées: {errorArrivals}</p>}

        {!loadingArrivals && !errorArrivals && arrivals.length === 0 && (
          <p>Aucune arrivée trouvée pour cette gare.</p>
        )}

        {!loadingArrivals && !errorArrivals && arrivals.length > 0 && (
          <>
            <h2>Arrivées</h2>
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Heure</th>
                  <th>Train</th>
                  <th>Provenance</th>
                  <th>Voie</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {arrivals.map(schedule => {
                  const normalize = (str) => str?.trim().toLowerCase();
                  const normalizedStation = normalize(station);
                  let time = schedule.arrivalTime;
                  if (normalize(schedule.arrivalStation) !== normalizedStation && Array.isArray(schedule.servedStations)) {
                    const served = schedule.servedStations.find(s => normalize(s.name) === normalizedStation);
                    if (served && served.arrivalTime) {
                      time = served.arrivalTime;
                    }
                  }
                  const origin = schedule.departureStation;
                  const status = schedule.isCancelled ? 'Supprimé' : (schedule.delayMinutes ? `Retard ${schedule.delayMinutes} min` : 'À l\'heure');

                  return (
                    <tr key={schedule.id}>
                      <td>{time || '-'}</td>
                      <td>{schedule.trainNumber}</td>
                      <td>{origin}</td>
                      <td>{schedule.track || '-'}</td>
                      <td>{status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </div>
    </Layout>
  );
}
