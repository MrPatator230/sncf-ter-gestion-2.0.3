// Fonction pour récupérer tous les horaires
export const getAllSchedules = () => {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem('schedules') || '[]');
};

// Fonction pour valider un horaire
const validateSchedule = (schedule) => {
  return schedule && 
         schedule.trainNumber && 
         schedule.departureStation && 
         schedule.arrivalStation && 
         schedule.departureTime && 
         schedule.arrivalTime;
};

// Fonction pour normaliser les gares desservies
const normalizeServedStations = (servedStations) => {
  if (!servedStations) return [];
  return servedStations.map(station => {
    if (typeof station === 'string') {
      return {
        name: station,
        arrivalTime: null,
        departureTime: null
      };
    }
    return station;
  }).filter(station => station.name);
};

// Fonction pour calculer l'heure retardée
export const getDelayedTime = (time, delayMinutes) => {
  if (!time || !delayMinutes) return time;
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + delayMinutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
};

// Fonction pour obtenir le statut du train
export const getTrainStatus = (schedule) => {
  if (schedule.isCancelled) {
    return {
      status: 'cancelled',
      label: 'Train supprimé',
      className: 'status-cancelled'
    };
  }
  
  if (schedule.delayMinutes) {
    return {
      status: 'delayed',
      label: `Retard ${schedule.delayMinutes} min`,
      className: 'status-delayed',
      delayedTime: getDelayedTime(schedule.departureTime, schedule.delayMinutes)
    };
  }

  return {
    status: 'ontime',
    label: 'À l\'heure',
    className: 'status-ontime'
  };
};

// Fonction pour récupérer les horaires d'une gare spécifique
export const getStationSchedules = (stationName) => {
  try {
    if (!stationName) return [];
    
    const schedules = getAllSchedules();
    const validSchedules = schedules.filter(validateSchedule);

    return validSchedules.filter(schedule => {
      // Vérifier si la gare est la gare de départ ou d'arrivée
      if (schedule.departureStation === stationName || 
          schedule.arrivalStation === stationName) {
        return true;
      }

      // Vérifier dans les gares desservies
      const normalizedServedStations = normalizeServedStations(schedule.servedStations);
      return normalizedServedStations.some(served => served.name === stationName);
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des horaires:', error);
    return [];
  }
};

// Fonction pour obtenir l'heure de départ ou d'arrivée pour une gare spécifique
export const getStationTime = (schedule, stationName, type = 'departure', applyDelay = true) => {
  if (!schedule || !stationName) return null;

  try {
    if (type === 'departure') {
      if (schedule.departureStation === stationName) {
        return schedule.isCancelled ? schedule.departureTime :
               (applyDelay && schedule.delayMinutes) ? getDelayedTime(schedule.departureTime, schedule.delayMinutes) :
               schedule.departureTime;
      }

      const normalizedServedStations = normalizeServedStations(schedule.servedStations);
      const servedStation = normalizedServedStations.find(s => s.name === stationName);
      if (!servedStation) return null;
      return (applyDelay && schedule.delayMinutes && servedStation.departureTime)
        ? getDelayedTime(servedStation.departureTime, schedule.delayMinutes)
        : servedStation.departureTime || null;

    } else {
      if (schedule.arrivalStation === stationName) {
        return schedule.isCancelled ? schedule.arrivalTime :
               (applyDelay && schedule.delayMinutes) ? getDelayedTime(schedule.arrivalTime, schedule.delayMinutes) :
               schedule.arrivalTime;
      }

      const normalizedServedStations = normalizeServedStations(schedule.servedStations);
      const servedStation = normalizedServedStations.find(s => s.name === stationName);
      if (!servedStation) return null;
      return (applyDelay && schedule.delayMinutes && servedStation.arrivalTime)
        ? getDelayedTime(servedStation.arrivalTime, schedule.delayMinutes)
        : servedStation.arrivalTime || null;
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'heure:', error);
    return null;
  }
};

// Fonction pour filtrer les horaires par type (départs ou arrivées)
export const filterSchedulesByType = (schedules, stationName, type = 'departures') => {
  if (!schedules || !stationName) return [];

  try {
    return schedules.filter(schedule => {
      if (!validateSchedule(schedule)) return false;

      if (type === 'departures') {
        // Pour les départs, inclure si c'est la gare de départ
        if (schedule.departureStation === stationName) return true;

        // Ou si c'est une gare desservie avec une heure de départ
        const normalizedServedStations = normalizeServedStations(schedule.servedStations);
        return normalizedServedStations.some(served => 
          served.name === stationName && served.departureTime
        );

      } else {
        // Pour les arrivées, inclure si c'est la gare d'arrivée
        if (schedule.arrivalStation === stationName) return true;

        // Ou si c'est une gare desservie avec une heure d'arrivée
        const normalizedServedStations = normalizeServedStations(schedule.servedStations);
        return normalizedServedStations.some(served => 
          served.name === stationName && served.arrivalTime
        );
      }
    });
  } catch (error) {
    console.error('Erreur lors du filtrage des horaires:', error);
    return [];
  }
};

// Fonction pour obtenir la destination ou la provenance d'un train
export const getStationEndpoint = (schedule, stationName, type = 'departures') => {
  if (!schedule || !stationName) return '';

  try {
    if (type === 'departures') {
      // Pour un départ, la destination est soit la gare d'arrivée,
      // soit la prochaine gare desservie après la gare actuelle
      if (schedule.departureStation === stationName) {
        return schedule.arrivalStation;
      }

      const normalizedServedStations = normalizeServedStations(schedule.servedStations);
      const stationIndex = normalizedServedStations.findIndex(s => s.name === stationName);
      
      if (stationIndex !== -1 && stationIndex < normalizedServedStations.length - 1) {
        return normalizedServedStations[stationIndex + 1].name;
      }
      
      return schedule.arrivalStation;

    } else {
      // Pour une arrivée, la provenance est soit la gare de départ,
      // soit la gare desservie précédente
      if (schedule.arrivalStation === stationName) {
        return schedule.departureStation;
      }

      const normalizedServedStations = normalizeServedStations(schedule.servedStations);
      const stationIndex = normalizedServedStations.findIndex(s => s.name === stationName);
      
      if (stationIndex > 0) {
        return normalizedServedStations[stationIndex - 1].name;
      }
      
      return schedule.departureStation;
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de la destination/provenance:', error);
    return '';
  }
};

// Fonction pour formater les jours de circulation
export const formatOperatingDays = (schedule) => {
  if (!schedule?.joursCirculation || schedule.joursCirculation.length === 0) {
    return 'Tous les jours';
  }

  try {
    const days = {
      'Monday': 'Lun',
      'Tuesday': 'Mar',
      'Wednesday': 'Mer',
      'Thursday': 'Jeu',
      'Friday': 'Ven',
      'Saturday': 'Sam',
      'Sunday': 'Dim'
    };

    return schedule.joursCirculation
      .map(day => days[day] || day)
      .join(', ');
  } catch (error) {
    console.error('Erreur lors du formatage des jours:', error);
    return 'Tous les jours';
  }
};

// Fonction pour trier les horaires par heure
export const sortSchedulesByTime = (schedules, stationName, type = 'departures') => {
  if (!schedules || !stationName) return [];

  try {
    return [...schedules].sort((a, b) => {
      const timeA = getStationTime(a, stationName, type === 'departures' ? 'departure' : 'arrival') || '';
      const timeB = getStationTime(b, stationName, type === 'departures' ? 'departure' : 'arrival') || '';
      return timeA.localeCompare(timeB);
    });
  } catch (error) {
    console.error('Erreur lors du tri des horaires:', error);
    return schedules;
  }
};

// Fonction pour mettre à jour un horaire existant dans localStorage
export const updateSchedule = (id, updatedSchedule) => {
  if (typeof window === 'undefined') return;

  const schedules = JSON.parse(localStorage.getItem('schedules') || '[]');
  const index = schedules.findIndex(schedule => schedule.id === id);
  if (index !== -1) {
    // Merge existing schedule with updatedSchedule, including quai, delayMinutes, isCancelled
    schedules[index] = { ...schedules[index], ...updatedSchedule, id };
    localStorage.setItem('schedules', JSON.stringify(schedules));
  } else {
    console.warn(`Schedule with id ${id} not found for update.`);
  }
};

export const resetDelaysAndCancellations = () => {
  if (typeof window === 'undefined') return;

  const schedules = JSON.parse(localStorage.getItem('schedules') || '[]');
  const updatedSchedules = schedules.map(schedule => ({
    ...schedule,
    delayMinutes: 0,
    isCancelled: false,
  }));
  localStorage.setItem('schedules', JSON.stringify(updatedSchedules));
};

/**
 * Fonction pour ajouter un nouvel horaire
 * @param {Object} schedule - L'objet horaire à ajouter
 */
export const addSchedule = (schedule) => {
  if (typeof window === 'undefined') return;

  const schedules = JSON.parse(localStorage.getItem('schedules') || '[]');
  const newSchedule = { ...schedule, id: Date.now() };
  schedules.push(newSchedule);
  localStorage.setItem('schedules', JSON.stringify(schedules));
};

// Fonction pour supprimer un horaire par id
export const deleteSchedule = (id) => {
  if (typeof window === 'undefined') return;

  const schedules = JSON.parse(localStorage.getItem('schedules') || '[]');
  const filteredSchedules = schedules.filter(schedule => schedule.id !== id);
  localStorage.setItem('schedules', JSON.stringify(filteredSchedules));
};
