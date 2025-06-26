import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import styles from './Afficheurs.module.css';
import { getStationSchedules, filterSchedulesByType, sortSchedulesByTime, getTrainStatus, getStationTime } from '../../utils/scheduleUtils';
import { useTrackAssignments } from '../../src/contexts/TrackAssignmentContext';
import Link from 'next/link';
import { SettingsContext } from '../../contexts/SettingsContext';

// Helper function to get current day string in English (e.g., 'Monday')
const getCurrentDay = () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const now = new Date();
  return days[now.getDay()];
};

export default function AfficheursPublic() {
  const router = useRouter();
  const { gare } = router.query;

  const { servedStationsLines } = useContext(SettingsContext);

  const trackAssignmentsContext = useTrackAssignments();
  const trackAssignments = trackAssignmentsContext ? trackAssignmentsContext.trackAssignments : {};

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trainTypeLogos, setTrainTypeLogos] = useState({});
  const [displayIndex, setDisplayIndex] = useState(0);

  useEffect(() => {
    let intervalId;

    async function fetchTrainTypeLogos() {
      try {
        const res = await fetch('/api/trainTypeLogos');
        if (res.ok) {
          const data = await res.json();
          setTrainTypeLogos(data);
        }
      } catch (error) {
        console.error('Failed to fetch train type logos:', error);
      }
    }

    async function fetchSchedules() {
      if (gare) {
        const stationSchedules = getStationSchedules(gare);
        const filteredByType = filterSchedulesByType(stationSchedules, gare, 'departures');

        // Filter schedules by current day of operation
        const currentDay = getCurrentDay();
        const filteredByDay = filteredByType.filter(schedule => {
          if (!schedule.joursCirculation || schedule.joursCirculation.length === 0) {
            return true; // If no joursCirculation specified, assume train runs every day
          }
          return schedule.joursCirculation.includes(currentDay);
        });

        const sorted = sortSchedulesByTime(filteredByDay, gare, 'departures');
        setSchedules(sorted);
        setLoading(false);
      } else {
        setSchedules([]);
        setLoading(false);
      }
    }

    async function fetchData() {
      await fetchTrainTypeLogos();
      await fetchSchedules();
    }

    fetchData();

    intervalId = setInterval(fetchData, 10000); // Poll every 10 seconds

    return () => clearInterval(intervalId);
  }, [gare]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayIndex(prev => (prev + 1) % 2);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!gare) {
    return (
      <main className={styles.afficheursContainer} role="main">
        <p className={styles.errorMessage}>Paramètre gare manquant. Veuillez fournir la gare dans l'URL.</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className={styles.afficheursContainer} role="main" aria-label="Tableau des départs">
        <p className={styles.loadingMessage}>Chargement...</p>
      </main>
    );
  }

  if (schedules.length === 0) {
    return (
      <main className={styles.afficheursContainer} role="main" aria-label="Tableau des départs">
        <p className={styles.noSchedulesMessage}>Aucun horaire trouvé pour cette gare.</p>
      </main>
    );
  }

  return (
    <main className={styles.afficheursContainer} role="main" aria-label="Tableau des départs">
      <ul className={styles.scheduleList} role="list">
        {schedules.map((schedule, index) => {
          const status = getTrainStatus(schedule);
          const trainType = schedule.trainType || 'MOBIGO';
          const logoSrc = trainTypeLogos[trainType] || '/images/sncf-logo.png';
          const isEven = index % 2 === 0;
          const displayTime = getStationTime(schedule, gare, 'departure');

          // Extract the status code string from the status object
          const statusCode = status.status;

          // Calculate delayed departure time string
          const getDelayedTime = () => {
            if (!schedule.delayMinutes || schedule.delayMinutes <= 0) return null;
            const [hours, minutes] = displayTime.split(':').map(Number);
            let date = new Date();
            date.setHours(hours);
            date.setMinutes(minutes + schedule.delayMinutes);
            const delayedHours = date.getHours().toString().padStart(2, '0');
            const delayedMinutes = date.getMinutes().toString().padStart(2, '0');
            return `${delayedHours}:${delayedMinutes}`;
          };

          const delayedTime = getDelayedTime();

          // Determine if the schedule should be hidden 2 minutes before departure or if departure time has passed except for last train
          const now = new Date();
          const [hours, minutes] = displayTime.split(':').map(Number);
          const departureDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
          const diffMinutes = (departureDate - now) / 60000;

          // Identify last train of the day
          const lastSchedule = schedules[schedules.length - 1];
          const lastDisplayTime = getStationTime(lastSchedule, gare, 'departure');
          const [lastHours, lastMinutes] = lastDisplayTime.split(':').map(Number);
          const lastDepartureDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), lastHours, lastMinutes);

          if ((diffMinutes < 2 && diffMinutes >= 0) || (diffMinutes < 0 && departureDate.getTime() !== lastDepartureDate.getTime())) {
            return null; // Hide the schedule row
          }

          return (
            <li className={`${styles.scheduleRow} ${isEven ? styles.scheduleRowEven : styles.scheduleRowOdd}`} role="listitem">
              <section className={styles.leftSection}>
                <div className={styles.sncfLogoContainer}>
                  <Image src={logoSrc} alt={trainType} layout="fill" objectFit="contain" />
                </div>
                <div className={styles.alternatingTextContainer}>
                  {displayIndex === 0 ? (
                    <div className={styles.trainTypeNameContainer}>
                      <div className={styles.trainTypeText}>{trainType}</div>
                      <div className={styles.trainNumberText}>{schedule.trainNumber || ''}</div>
                    </div>
                  ) : (
                    <>
                      {statusCode === 'ontime' && <div className={styles.statusText}>à l&apos;heure</div>}
                      {statusCode === 'delayed' && <div className={styles.statusText}>Retardé</div>}
                      {statusCode === 'cancelled' && <div className={styles.statusText}>Supprimé</div>}
                    </>
                  )}
                </div>
                <time className={styles.departureTime} dateTime={displayTime} style={{ color: '#ffea00' }}>
                  {displayTime.replace(':', 'h')}
                </time>
              </section>
              <section className={styles.middleSection}>
                <div className={styles.destination}>{schedule.arrivalStation}</div>
                {schedule.servedStations && schedule.servedStations.length > 0 && (
                  <div className={styles.servedStations}>
                    <div className={styles.marquee} aria-label="Liste des gares desservies" role="list">
                      <div className={styles.marqueeContent}>
                        {(() => {
                          const selectedStation = gare;
                          let stationsList = [];
                          if (schedule.servedStations && schedule.servedStations.length > 0) {
                            const normalizedStations = schedule.servedStations.map((station) =>
                              typeof station === 'object' ? station.name : station
                            );
                            const startIndex = normalizedStations.indexOf(selectedStation);
                            if (startIndex !== -1) {
                              stationsList = normalizedStations.slice(startIndex + 1);
                            } else {
                              stationsList = normalizedStations;
                            }
                          }
                          return stationsList.map((station, idx) => (
                            <span key={idx} className={styles.stationName} role="listitem">
                              {idx > 0 && <span className={styles.dotSeparator} aria-hidden="true">•</span>}
                              {station}
                            </span>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </section>
              {(() => {
                const now = new Date();
                const [hours, minutes] = displayTime.split(':').map(Number);
                const departureDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
                const diffMinutes = (departureDate - now) / 60000;
                return (
                  <div
                    className={`${styles.rightSection} ${!(diffMinutes <= 30 && diffMinutes >= 0) ? styles.hiddenSquare : ''}`}
                    aria-hidden={!(diffMinutes <= 30 && diffMinutes >= 0)}
                  >
                    {diffMinutes <= 30 && diffMinutes >= 0 ? (trackAssignments[schedule.id]?.[gare] || schedule.track || '-') : ''}
                  </div>
                );
              })()}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
