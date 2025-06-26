import { useState, useEffect, useContext } from 'react';
import Layout from '../../components/Layout';
import { AuthContext } from '../../src/contexts/AuthContext';
import modalStyles from '../modal.module.css';

export default function GestionHoraires() {
  const { isAuthenticated, role } = useContext(AuthContext);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [trackAssignments, setTrackAssignments] = useState({});

  useEffect(() => {
    if (!isAuthenticated || role !== 'admin') {
      // Redirect or show unauthorized message
      return;
    }
    async function fetchSchedules() {
      try {
        console.log('Fetching schedules and status data...');
        const [schedulesRes, statusRes] = await Promise.all([
          fetch('/api/schedules'),
          fetch('/api/gestion-horaires'),
        ]);
        if (!schedulesRes.ok) throw new Error('Failed to fetch schedules');
        if (!statusRes.ok) throw new Error('Failed to fetch gestion horaires');
        const schedulesData = await schedulesRes.json();
        const statusData = await statusRes.json();
        console.log('Schedules data:', schedulesData);
        console.log('Status data:', statusData);

        // Convert snake_case keys to camelCase for each schedule
        const camelCaseSchedules = schedulesData.map(schedule => ({
          id: schedule.id,
          trainNumber: schedule.train_number,
          departureStation: schedule.departure_station,
          arrivalStation: schedule.arrival_station,
          arrivalTime: schedule.arrival_time,
          departureTime: schedule.departure_time,
          trainType: schedule.train_type,
          rollingStockFileName: schedule.rolling_stock_file_name,
          composition: schedule.composition,
          joursCirculation: schedule.jours_circulation,
          servedStations: schedule.served_stations,
          createdAt: schedule.created_at,
          updatedAt: schedule.updated_at,
          delayMinutes: 0,
          isCancelled: false,
          trackAssignments: {},
        }));

        // Map status data by schedule_id
        const statusMap = {};
        statusData.forEach(status => {
          statusMap[status.schedule_id] = status;
        });

        // Merge status data into schedules
        const mergedSchedules = camelCaseSchedules.map(schedule => {
          const status = statusMap[schedule.id];
          if (status) {
            return {
              ...schedule,
              delayMinutes: status.delay_minutes,
              isCancelled: status.is_cancelled,
              trackAssignments: status.track_assignments || {},
            };
          }
          return schedule;
        });

        setSchedules(mergedSchedules);

        // Initialize track assignments from schedules if available
        const initialTracks = {};
        mergedSchedules.forEach(schedule => {
          if (schedule.trackAssignments) {
            initialTracks[schedule.id] = schedule.trackAssignments;
          }
        });
        setTrackAssignments(initialTracks);
      } catch (error) {
        console.error('Error fetching schedules:', error);
      } finally {
        setLoading(false);
        console.log('Loading set to false');
      }
    }
    fetchSchedules();
  }, [isAuthenticated, role]);

  const openModal = (schedule) => {
    setSelectedSchedule(schedule);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedSchedule(null);
    setShowModal(false);
  };

  const handleChange = async (scheduleId, field, value) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    if (field === 'delayMinutes' || field === 'isCancelled' || field === null) {
      let newSchedule;
      if (field === null && typeof value === 'object') {
        newSchedule = { ...schedule, ...value };
      } else {
        newSchedule = { ...schedule, [field]: value };
      }
      try {
        // Update schedule status in gestion_horaires table
        const res = await fetch('/api/gestion-horaires', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schedule_id: scheduleId,
            delay_minutes: newSchedule.delayMinutes,
            is_cancelled: newSchedule.isCancelled,
            track_assignments: trackAssignments[scheduleId] || {},
          }),
        });
        if (!res.ok) throw new Error('Failed to update schedule status');

        // Update local state
        const updatedSchedules = schedules.map(s => s.id === scheduleId ? newSchedule : s);
        setSchedules(updatedSchedules);
      } catch (error) {
        console.error(error);
        setMessage({ type: 'error', text: 'Erreur lors de la mise à jour de l\'horaire.' });
      }
      return;
    }

    // Handle track assignments update locally
    setTrackAssignments(prev => {
      const updated = { ...prev };
      if (!updated[scheduleId]) updated[scheduleId] = {};
      updated[scheduleId][field] = value;
      return updated;
    });
  };

  const handleReset = async () => {
    try {
      for (const schedule of schedules) {
        await fetch(`/api/schedules/${schedule.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ delayMinutes: 0, isCancelled: false }),
        });
      }
      const res = await fetch('/api/schedules');
      if (!res.ok) throw new Error('Failed to fetch schedules');
      const data = await res.json();
      setSchedules(data);
      setMessage({ type: 'success', text: 'Retards et suppressions remis à zéro.' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Erreur lors de la remise à zéro.' });
    }
  };

  const handleGlobalUpdate = async () => {
    setSending(true);
    setMessage(null);
    try {
      // Assuming an API endpoint to update track assignments in bulk
      const res = await fetch('/api/updateTrackAssignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trackAssignments),
      });
      if (!res.ok) throw new Error('Erreur lors de la mise à jour des quais');
      setMessage({ type: 'success', text: 'Attributions des quais envoyées avec succès.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Layout><p>Chargement...</p></Layout>;

  return (
    <Layout>
      <div className="container py-4">
        <h1>Gestion des Horaires</h1>
        <button className="btn btn-danger mb-3" onClick={handleReset}>
          Remettre à zéro retards et suppressions
        </button>
        <button
          className="btn btn-primary mb-3 ms-3"
          onClick={handleGlobalUpdate}
          disabled={sending}
        >
          {sending ? (
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          ) : null}
          Envoyer au Serveur
        </button>
        {message && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`} role="alert">
            {message.text}
          </div>
        )}
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Train</th>
              <th>Départ</th>
              <th>Arrivée</th>
              <th>Retard (min)</th>
              <th>Supprimé</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map(schedule => (
              <tr key={schedule.id} style={schedule.isCancelled ? { textDecoration: 'line-through', color: 'red' } : {}}>
                <td>{schedule.trainNumber}</td>
                <td>{schedule.departureStation}</td>
                <td>{schedule.arrivalStation}</td>
                <td>
                  <input
                    type="number"
                    min="0"
                    className="form-control"
                    value={schedule.delayMinutes || 0}
                    onChange={e => {
                      const value = parseInt(e.target.value) || 0;
                      if (value >= 0) {
                        handleChange(schedule.id, 'delayMinutes', value);
                      }
                    }}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    checked={schedule.isCancelled || false}
                    onChange={e => {
                      const checked = e.target.checked;
                      handleChange(schedule.id, null, { isCancelled: checked, delayMinutes: checked ? 0 : undefined });
                    }}
                    aria-label={`Supprimé pour le train ${schedule.trainNumber}`}
                  />
                </td>
                <td>
                  <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => openModal(schedule)}
                  >
                    <i className="icons-edit me-2"></i>
                    Modifier les arrêts
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {showModal && selectedSchedule && (
          <div className={modalStyles.modalBackdrop}>
            <div className={modalStyles.modal}>
              <div className={modalStyles.modalHeader}>
                <h5 className={modalStyles.modalTitle}>
                  Modification des quais - Train {selectedSchedule.trainNumber}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={closeModal}
                  aria-label="Close"
                ></button>
              </div>
              <div className={modalStyles.modalBody}>
                <div className="mb-3">
                  <label className="form-label">
                    <i className="icons-departure me-2"></i>
                    Départ: {selectedSchedule.departureStation}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={trackAssignments[selectedSchedule.id]?.[selectedSchedule.departureStation] || ''}
                    onChange={e => handleChange(selectedSchedule.id, selectedSchedule.departureStation, e.target.value)}
                    placeholder="Quai"
                  />
                </div>

                {selectedSchedule.servedStations && selectedSchedule.servedStations.map((station, idx) => {
                  const stationName = typeof station === 'object' ? station.name : station;
                  return (
                    <div className="mb-3" key={`${selectedSchedule.id}-station-${idx}`}>
                      <label className="form-label">
                        <i className="icons-clock me-2"></i>
                        Arrêt: {stationName}
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={trackAssignments[selectedSchedule.id]?.[stationName] || ''}
                        onChange={e => handleChange(selectedSchedule.id, stationName, e.target.value)}
                        placeholder="Quai"
                      />
                    </div>
                  );
                })}

                <div className="mb-3">
                  <label className="form-label">
                    <i className="icons-arrival me-2"></i>
                    Arrivée: {selectedSchedule.arrivalStation}
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={trackAssignments[selectedSchedule.id]?.[selectedSchedule.arrivalStation] || ''}
                    onChange={e => handleChange(selectedSchedule.id, selectedSchedule.arrivalStation, e.target.value)}
                    placeholder="Quai"
                  />
                </div>
              </div>
              <div className={modalStyles.modalFooter}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={closeModal}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <style jsx>{`
        .container {
          max-width: 900px;
        }
        .form-label {
          font-weight: 600;
        }
      `}</style>
    </Layout>
  );
}
