import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import StationForm from './StationForm';
import StationsList from './StationsList';

export default function Stations() {
  const [stations, setStations] = useState([]);
  const [name, setName] = useState('');
  const [categories, setCategories] = useState([]);
  const [locationType, setLocationType] = useState('Ville'); // default to Ville
  const [editIndex, setEditIndex] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const allCategories = ['TER', 'TGV', 'Intercités', 'FRET', 'Autres'];

  const categoryColors = {
    TER: 'primary',
    TGV: 'danger',
    Intercités: 'success',
    FRET: 'warning',
    Autres: 'secondary',
  };

  const pageSize = 10;
  const totalPages = Math.ceil(stations.length / pageSize);

  useEffect(() => {
    async function fetchStations() {
      try {
        const res = await fetch('/api/stations');
        if (res.ok) {
          const data = await res.json();
          setStations(data);
        }
      } catch (error) {
        console.error('Failed to fetch stations:', error);
      }
    }
    fetchStations();
  }, []);

  const saveStations = async (stationsToSave) => {
    try {
      const res = await fetch('/api/stations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stationsToSave),
      });
      if (!res.ok) {
        alert('Erreur lors de l\'enregistrement des gares.');
      }
    } catch (error) {
      alert('Erreur lors de l\'enregistrement des gares.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || categories.length === 0) return;

    if (editIndex !== null) {
      // Update existing station
      const updatedStations = [...stations];
      updatedStations[editIndex] = { name, categories, locationType };
      setStations(updatedStations);
      saveStations(updatedStations);
      setEditIndex(null);
    } else {
      // Add new station
      const updatedStations = [...stations, { name, categories, locationType }];
      setStations(updatedStations);
      saveStations(updatedStations);
    }
    setName('');
    setCategories([]);
    setLocationType('Ville');
  };

  const handleCategoryChange = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setCategories(selected);
  };

  const handleEdit = (index) => {
    const station = stations[index];
    setName(station.name);
    setCategories(station.categories);
    setLocationType(station.locationType || 'Ville');
    setEditIndex(index);
  };

  const handleDelete = (index) => {
    const updatedStations = stations.filter((_, i) => i !== index);
    setStations(updatedStations);
    saveStations(updatedStations);
    if (editIndex === index) {
      setName('');
      setCategories([]);
      setEditIndex(null);
    }
    // Adjust current page if needed
    if ((updatedStations.length <= (currentPage - 1) * pageSize) && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const paginatedStations = stations.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const cancelEdit = () => {
    setName('');
    setCategories([]);
    setEditIndex(null);
  };

  return (
    <div id="wrapper" style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div id="content-wrapper" className="d-flex flex-column flex-grow-1">
        <div id="content" className="container mt-4 flex-grow-1">
          <h1>Gestion de gares</h1>
          <StationForm
            name={name}
            setName={setName}
            categories={categories}
            setCategories={setCategories}
            locationType={locationType}
            setLocationType={setLocationType}
            allCategories={allCategories}
            handleCategoryChange={handleCategoryChange}
            handleSubmit={handleSubmit}
            editIndex={editIndex}
            cancelEdit={cancelEdit}
          />
          <StationsList
            paginatedStations={paginatedStations}
            categoryColors={categoryColors}
            currentPage={currentPage}
            pageSize={pageSize}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            totalPages={totalPages}
            goToPreviousPage={goToPreviousPage}
            goToNextPage={goToNextPage}
          />
        </div>
      </div>
    </div>
  );
}
