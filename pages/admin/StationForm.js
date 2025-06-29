import React from 'react';

const StationForm = ({
  name,
  setName,
  categories,
  setCategories,
  allCategories = [], // default to empty array to avoid undefined
  handleCategoryChange,
  handleSubmit,
  editIndex,
  cancelEdit,
}) => {
  return (
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
          onClick={cancelEdit}
        >
          Annuler
        </button>
      )}
    </form>
  );
};

export default StationForm;
