
import { useState, useEffect, useContext } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Sidebar from '../../components/Sidebar';
import DraggableRollingStock from '../../components/admin/DraggableRollingStock';
import CompositionDropZone from '../../components/admin/CompositionDropZone';
import TrainVisualSlider from '../../components/TrainVisualSlider';
import { SettingsContext } from '../../contexts/SettingsContext';
import { extractStationsFromSchedule } from '../../utils/stationUtils';

export default function CompositionsTrains() {
  const { primaryColor, buttonStyle } = useContext(SettingsContext);
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [computedStations, setComputedStations] = useState([]);
  const [materielsRoulants, setMaterielsRoulants] = useState([]);
  const [composition, setComposition] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [trainNumber, setTrainNumber] = useState('');
  const [error, setError] = useState('');
  const [editingMaterielId, setEditingMaterielId] = useState(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [showTrainVisual, setShowTrainVisual] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [schedulesRes, materielsRes] = await Promise.all([
          fetch('/api/schedules'),
          fetch('/api/materiels-roulants'),
        ]);

        if (schedulesRes.ok) {
          const schedulesData = await schedulesRes.json();
          setSchedules(schedulesData);
        }

        if (materielsRes.ok) {
          const materielsData = await materielsRes.json();
          setMaterielsRoulants(materielsData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }

    fetchData();
  }, []);

  const handleTrainNumberSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/schedules/by-train-number?trainNumber=${encodeURIComponent(trainNumber)}`);
      if (!res.ok) {
        setError('Numéro de train non trouvé');
        setSelectedSchedule(null);
        setComposition([]);
        setComputedStations([]);
        setShowTrainVisual(false);
        return;
      }
      const schedule = await res.json();
      setSelectedSchedule(schedule);
      setComposition(schedule?.composition || []);
      setComputedStations(extractStationsFromSchedule(schedule));
      setError('');
      setShowTrainVisual(false);
    } catch (error) {
      console.error('Error fetching schedule by train number:', error);
      setError('Erreur lors de la recherche du numéro de train');
      setSelectedSchedule(null);
      setComposition([]);
      setComputedStations([]);
      setShowTrainVisual(false);
    }
  };

  const handleDrop = (item) => {
    if (Array.isArray(item)) {
      setComposition(item);
    } else {
      setComposition(prev => [...prev, item]);
    }
    setShowTrainVisual(false);
  };

  const handleSaveComposition = async () => {
    if (!selectedSchedule) {
      alert('Veuillez sélectionner un horaire');
      return;
    }

    try {
      // Defensive check for required fields
      if (!selectedSchedule.trainNumber || !selectedSchedule.departureStation || !selectedSchedule.arrivalStation ||
          !selectedSchedule.arrivalTime || !selectedSchedule.departureTime || !selectedSchedule.trainType) {
        alert('Les informations de l\'horaire sont incomplètes. Veuillez vérifier les données.');
        return;
      }

      const payload = {
        trainNumber: selectedSchedule.trainNumber,
        departureStation: selectedSchedule.departureStation,
        arrivalStation: selectedSchedule.arrivalStation,
        arrivalTime: selectedSchedule.arrivalTime,
        departureTime: selectedSchedule.departureTime,
        trainType: selectedSchedule.trainType,
        rollingStockFileName: composition.length > 0 ? composition[0].name : null,
        composition: composition,
        joursCirculation: selectedSchedule.joursCirculation || [],
        servedStations: selectedSchedule.servedStations || [],
      };

      console.log('Saving schedule with payload:', payload);

      const response = await fetch(`/api/schedules/${selectedSchedule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        alert('Erreur lors de la mise à jour de la composition');
        return;
      }

      const updatedSchedule = await response.json();

      // Update local state
      const updatedSchedules = schedules.map(schedule =>
        schedule.id === updatedSchedule.id ? updatedSchedule : schedule
      );
      setSchedules(updatedSchedules);

      setSelectedSchedule(updatedSchedule);
      setShowTrainVisual(true);
      alert('Composition enregistrée avec succès');
    } catch (error) {
      console.error('Error saving composition:', error);
      alert('Erreur lors de l\'enregistrement de la composition');
    }
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleMaterielSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !type.trim() || (editingMaterielId === null && !imageFile)) {
      alert('Veuillez remplir tous les champs et ajouter une image.');
      return;
    }

    const processSave = (imageData) => {
      let updatedMateriels;
      if (editingMaterielId !== null) {
        updatedMateriels = materielsRoulants.map(m => {
          if (m.id === editingMaterielId) {
            return {
              ...m,
              name: name.trim(),
              type: type.trim(),
              imageData: imageData || m.imageData,
              imageName: `${name.toLowerCase().replace(/\s+/g, '-')}.png`
            };
          }
          return m;
        });
      } else {
        const newMateriel = {
          id: Date.now(),
          name: name.trim(),
          type: type.trim(),
          imageData,
          imageName: `${name.toLowerCase().replace(/\s+/g, '-')}.png`
        };
        updatedMateriels = [...materielsRoulants, newMateriel];
      }
      
      localStorage.setItem('materielsRoulants', JSON.stringify(updatedMateriels));
      setMaterielsRoulants(updatedMateriels);
      setEditingMaterielId(null);
      setName('');
      setType('');
      setImageFile(null);
      e.target.reset();
    };

    if (imageFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        processSave(reader.result);
      };
      reader.readAsDataURL(imageFile);
    } else {
      processSave(null);
    }
  };

  const handleEdit = (materiel) => {
    setEditingMaterielId(materiel.id);
    setName(materiel.name);
    setType(materiel.type);
    setImageFile(null);
  };

  const handleDelete = (id) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce matériel roulant ?')) {
      const newMateriels = materielsRoulants.filter(m => m.id !== id);
      localStorage.setItem('materielsRoulants', JSON.stringify(newMateriels));
      setMaterielsRoulants(newMateriels);
      if (editingMaterielId === id) {
        setEditingMaterielId(null);
        setName('');
        setType('');
        setImageFile(null);
      }
    }
  };

  const getBorderRadius = () => {
    switch (buttonStyle) {
      case 'rounded':
        return '25px';
      case 'square':
        return '0';
      default:
        return '4px';
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div id="wrapper" style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <div id="content-wrapper" className="d-flex flex-column flex-grow-1">
          <div id="content" className="container-fluid py-4">
            <h1 className="h3 mb-4" style={{ color: primaryColor }}>
              Compositions des Trains
            </h1>

            <div className="row">
              <div className="col-lg-8">
                {/* Train Number Search */}
              <div className="card shadow-sm mb-4">
                <div className="card-body">
                  <form onSubmit={handleTrainNumberSubmit} className="row g-3 align-items-end">
                    <div className="col-md-8">
                      <label className="form-label">Numéro du train</label>
                      <input
                        type="text"
                        className={`form-control ${error ? 'is-invalid' : ''}`}
                        value={trainNumber}
                        onChange={(e) => setTrainNumber(e.target.value)}
                        placeholder="Entrez le numéro du train"
                        style={{ borderRadius: getBorderRadius() }}
                      />
                      {error && <div className="invalid-feedback">{error}</div>}
                    </div>
                    <div className="col-md-4">
                      <button
                        type="submit"
                        className="btn w-100"
                        style={{
                          backgroundColor: primaryColor,
                          color: 'white',
                          borderRadius: getBorderRadius()
                        }}
                      >
                        Rechercher
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {selectedSchedule && (
                <>
                  {/* Train Visual */}
                  {showTrainVisual && (
                    <div className="card shadow-sm mb-4">
                      <div className="card-body">
                        <h2 className="h5 mb-4" style={{ color: primaryColor }}>
                          Visualisation du Train {selectedSchedule.trainNumber}
                        </h2>
                        <TrainVisualSlider
                          trainNumber={selectedSchedule.trainNumber}
                          composition={composition}
                        />
                      </div>
                    </div>
                  )}

                  {/* Composition Management */}
                  <div className="card shadow-sm mb-4">
                    <div className="card-body">
                      <h2 className="h5 mb-4" style={{ color: primaryColor }}>
                        Composition du Train {selectedSchedule.trainNumber}
                      </h2>
                      <CompositionDropZone
                        onDrop={handleDrop}
                        composition={composition}
                      />
                      <button
                        onClick={handleSaveComposition}
                        className="btn w-100 mt-3"
                        style={{
                          backgroundColor: primaryColor,
                          color: 'white',
                          borderRadius: getBorderRadius()
                        }}
                      >
                        Enregistrer la Composition
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Matériel Roulant Management */}
              <div className="card shadow-sm mb-4">
                <div className="card-body">
                  <h2 className="h5 mb-4" style={{ color: primaryColor }}>
                    Gestion du Matériel Roulant
                  </h2>
                  

                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="Rechercher un matériel roulant..."
                      className="form-control"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ borderRadius: getBorderRadius() }}
                    />
                  </div>

                  <div className="row g-3">
                    {materielsRoulants
                      .filter(materiel =>
                        materiel.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        materiel.type?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map(materiel => (
                        <div key={materiel.id} className="col-md-6">
                          <DraggableRollingStock 
                            item={materiel}
                            onEdit={() => handleEdit(materiel)}
                            onDelete={() => handleDelete(materiel.id)}
                          />
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              {selectedSchedule && (
              <div className="card shadow-sm">
                <div className="card-body">
                  <h2 className="h5 mb-4" style={{ color: primaryColor }}>
                    Arrêts desservis
                  </h2>
                  <div className="timeline">
                    {selectedSchedule ? (
                      <>
                        <div className="timeline-item">
                          <div className="timeline-content">
                            <strong style={{ color: primaryColor }}>{selectedSchedule.departureStation}</strong>
                          </div>
                        </div>
                        {selectedSchedule.servedStations && selectedSchedule.servedStations.length > 0 ? (
                          selectedSchedule.servedStations.map((station, index) => (
                            <div key={index} className="timeline-item">
                              <div className="timeline-content">
                                <strong style={{ color: primaryColor }}>{station.name}</strong>
                                <div>Arrivée: {station.arrival_time || '-'}</div>
                                <div>Départ: {station.departure_time || '-'}</div>
                              </div>
                            </div>
                          ))
                        ) : null}
                        <div className="timeline-item">
                          <div className="timeline-content">
                            <strong style={{ color: primaryColor }}>{selectedSchedule.arrivalStation}</strong>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p>Aucune gare desservie disponible.</p>
                    )}
                  </div>
                </div>
              </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .timeline-item {
          position: relative;
          padding-left: 20px;
          margin-bottom: 1rem;
        }
        .timeline-item:before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 2px;
          background-color: ${primaryColor};
        }
        .timeline-item:after {
          content: '';
          position: absolute;
          left: -4px;
          top: 8px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: ${primaryColor};
        }
        .form-control:focus {
          border-color: ${primaryColor};
          box-shadow: 0 0 0 0.25rem ${primaryColor}40;
        }
      `}</style>
    </DndProvider>
  );
}
