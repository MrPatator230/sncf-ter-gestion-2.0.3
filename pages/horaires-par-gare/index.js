import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import StationSearchForm from '../../components/StationSearchForm';

export default function HorairesParGare() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const response = await fetch('/api/stations');
        if (!response.ok) {
          throw new Error('Failed to fetch stations');
        }
        const data = await response.json();
        setStations(data);
      } catch (error) {
        console.error('Error fetching stations:', error);
        setStations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

  const filteredStations = stations.filter(station =>
    station.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <nav className="breadcrumb bg-transparent">
              <span className="breadcrumb-item">
                <i className="icons-home icons-size-1x5" aria-hidden="true"></i>
              </span>
              <span className="breadcrumb-item active">Horaires par gare</span>
            </nav>

            <div className="card border-0 shadow-sm">
              <div className="card-header bg-primary text-white">
                <h1 className="h4 mb-0">
                  <i className="icons-station icons-size-1x5 mr-2" aria-hidden="true"></i>
                  Rechercher les horaires d'une gare
                </h1>
              </div>
              <div className="card-body">
                <div className="text-center mb-4">
                  <p className="lead mb-0">
                    Consultez les horaires des trains au départ et à l'arrivée de votre gare
                  </p>
                </div>
                <StationSearchForm searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
              </div>
            </div>

            <div className="card border-0 shadow-sm mt-4">
              <div className="card-header bg-light">
                <h2 className="h5 mb-0">Gares disponibles</h2>
              </div>
              <div className="card-body">
                {loading ? (
                  <div>Chargement des gares...</div>
                ) : filteredStations.length === 0 ? (
                  <div>Aucune gare trouvée.</div>
                ) : (
                  <ul className="list-unstyled">
                    {filteredStations.map((station) => (
                      <li key={station.name}>
                        <Link legacyBehavior href={`/horaires-par-gare/${encodeURIComponent(station.name)}`}>
                          <a>{station.name}</a>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="row mt-4">
              <div className="col-md-6">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <h2 className="h5 mb-3">
                      <i className="icons-info icons-size-1x5 mr-2" aria-hidden="true"></i>
                      Comment ça marche ?
                    </h2>
                    <ol className="pl-3">
                      <li className="mb-2">Saisissez le nom de votre gare dans le champ de recherche</li>
                      <li className="mb-2">Sélectionnez votre gare dans la liste des suggestions</li>
                      <li>Consultez les horaires des trains au départ et à l'arrivée</li>
                    </ol>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <h2 className="h5 mb-3">
                      <i className="icons-calendar icons-size-1x5 mr-2" aria-hidden="true"></i>
                      Informations disponibles
                    </h2>
                    <ul className="list-unstyled">
                      <li className="mb-2">
                        <i className="icons-clock-forward mr-2" aria-hidden="true"></i>
                        Horaires des départs
                      </li>
                      <li className="mb-2">
                        <i className="icons-clock-back mr-2" aria-hidden="true"></i>
                        Horaires des arrivées
                      </li>
                      <li className="mb-2">
                        <i className="icons-calendar-ticket mr-2" aria-hidden="true"></i>
                        Jours de circulation
                      </li>
                      <li>
                        <i className="icons-info mr-2" aria-hidden="true"></i>
                        Informations sur les trains
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .card {
          border-radius: 8px;
        }

        .card-header {
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
        }

        .lead {
          color: #666;
        }

        .icons-size-1x5 {
          font-size: 1.5rem;
          vertical-align: middle;
        }

        .breadcrumb {
          padding: 1rem 0;
        }

        .list-unstyled li {
          color: #495057;
          margin-bottom: 0.5rem;
        }

        .list-unstyled li a {
          color: #007bff;
          text-decoration: none;
        }

        .list-unstyled li a:hover {
          text-decoration: underline;
        }

        .list-unstyled i {
          color: #000044;
        }

        ol {
          color: #495057;
        }

        .card-body {
          padding: 2rem;
        }
      `}</style>
    </Layout>
  );
}
