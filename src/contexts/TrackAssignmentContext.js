import { createContext, useContext, useState, useEffect } from 'react';

const TrackAssignmentContext = createContext();

export function TrackAssignmentProvider({ children }) {
  const [trackAssignments, setTrackAssignments] = useState({});

  useEffect(() => {
    // Load track assignments from localStorage on mount
    const savedAssignments = localStorage.getItem('trackAssignments');
    if (savedAssignments) {
      setTrackAssignments(JSON.parse(savedAssignments));
    }
  }, []);

  const updateTrackAssignment = (scheduleId, station, track) => {
    setTrackAssignments(prev => {
      const updated = {
        ...prev,
        [scheduleId]: {
          ...(prev[scheduleId] || {}),
          [station]: track
        }
      };
      // Save to localStorage
      localStorage.setItem('trackAssignments', JSON.stringify(updated));
      return updated;
    });
  };

  const removeTrackAssignment = (scheduleId, station) => {
    setTrackAssignments(prev => {
      const updated = { ...prev };
      if (updated[scheduleId]) {
        delete updated[scheduleId][station];
        if (Object.keys(updated[scheduleId]).length === 0) {
          delete updated[scheduleId];
        }
      }
      // Save to localStorage
      localStorage.setItem('trackAssignments', JSON.stringify(updated));
      return updated;
    });
  };

  const clearTrackAssignments = () => {
    setTrackAssignments({});
    localStorage.removeItem('trackAssignments');
  };

  return (
    <TrackAssignmentContext.Provider
      value={{
        trackAssignments,
        updateTrackAssignment,
        removeTrackAssignment,
        clearTrackAssignments
      }}
    >
      {children}
    </TrackAssignmentContext.Provider>
  );
}

export function useTrackAssignments() {
  const context = useContext(TrackAssignmentContext);
  if (context === undefined) {
    throw new Error('useTrackAssignments must be used within a TrackAssignmentProvider');
  }
  return context;
}
