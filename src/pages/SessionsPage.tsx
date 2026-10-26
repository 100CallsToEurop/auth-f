import { PageHeader } from '../components/PageHeader';
import { SessionsPanel } from '../components/SessionsPanel';
import { useProfileOutlet } from './useProfileOutlet';

/** Устройства, с которых выполнен вход, и управление сессиями. */
export function SessionsPage() {
  const { reportError } = useProfileOutlet();

  return (
    <div className="page-content">
      <PageHeader
        title="Сессии"
        description="Проверьте, где вы вошли, и завершите лишние сессии."
      />

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Активные устройства</h2>
            <p className="muted small">
              Завершение сессии сразу закрывает доступ с этого устройства.
            </p>
          </div>
        </div>
        <SessionsPanel onError={reportError} />
      </section>
    </div>
  );
}
