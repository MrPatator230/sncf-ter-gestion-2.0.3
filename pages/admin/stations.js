import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';

export default function Stations() {
  const [stations, setStations] = useState([]);
  const [name, setName] = useState('');
  const [categories, setCategories] = useState([]);
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
      updatedStations[editIndex] = { name, categories };
      setStations(updatedStations);
      saveStations(updatedStations);
      setEditIndex(null);
    } else {
      // Add new station
      const updatedStations = [...stations, { name, categories }];
      setStations(updatedStations);
      saveStations(updatedStations);
    }
    setName('');
    setCategories([]);
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

  return (
    <div id="wrapper" style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div id="content-wrapper" className="d-flex flex-column flex-grow-1">
        <div id="content" className="container mt-4 flex-grow-1">
          <h1>Gestion de gares</h1>
          <form onSubmit={handleSubmit} className="mb-4">
            <div className="form-group mb-3">
              <label htmlFor="stationName">Nom de la gare</label>
              <input
                type="text"
                id="stationName"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group mb-3">
              <label htmlFor="categories">Catégories</label>
              <select
                id="categories"
                className="form-control"
                multiple
                value={categories}
                onChange={handleCategoryChange}
                required
              >
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              {editIndex !== null ? 'Modifier la gare' : 'Ajouter la gare'}
            </button>
            {editIndex !== null && (
              <button
                type="button"
                className="btn btn-secondary ms-2"
                onClick={() => {
                  setName('');
                  setCategories([]);
                  setEditIndex(null);
                }}
              >
                Annuler
              </button>
            )}
          </form>

          <h2>Liste des gares créées</h2>
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Nom de la gare</th>
                <th>Catégories</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStations.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center">Aucune gare créée</td>
                </tr>
              ) : (
                paginatedStations.map((station, index) => (
                  <tr key={index}>
                    <td>{station.name}</td>
                    <td>
                      {station.categories.map((cat) => (
                        <span key={cat} className={`badge bg-${categoryColors[cat]} me-1`}>
                          {cat}
                        </span>
                      ))}
                    </td>
                    <td>
                      <button className="btn btn-sm btn-warning me-2" onClick={() => handleEdit((currentPage - 1) * pageSize + index)}>Modifier</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete((currentPage - 1) * pageSize + index)}>Supprimer</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <nav aria-label="Page navigation example">
              <ul className="pagination justify-content-center">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={goToPreviousPage}>Précédent</button>
                </li>
                <li className="page-item disabled">
                  <span className="page-link">
                    Page {currentPage} sur {totalPages}
                  </span>
                </li>
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={goToNextPage}>Suivant</button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
