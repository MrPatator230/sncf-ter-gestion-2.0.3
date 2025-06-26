import Layout from '../../components/Layout';
import StationSearchForm from '../../components/StationSearchForm';

export default function HorairesParGare() {
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
                <StationSearchForm />
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
