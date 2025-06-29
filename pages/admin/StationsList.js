import React from 'react';

const StationsList = ({
  paginatedStations = [], // default to empty array
  categoryColors = {}, // default to empty object
  currentPage,
  pageSize,
  handleEdit,
  handleDelete,
  totalPages,
  goToPreviousPage,
  goToNextPage,
}) => {
  return (
    <>
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
                  {station.categories && Array.isArray(station.categories) && station.categories.map((cat) => (
                    <span key={cat} className={`badge bg-${categoryColors[cat] || 'secondary'} me-1`}>
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
    </>
  );
};

export default StationsList;
