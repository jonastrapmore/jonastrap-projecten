import { Outlet } from 'react-router';
import { NavTabs } from './components/NavTabs';
import { PageHeader } from './components/PageHeader';
import { ownershipConfig } from './config/verdeling';
import { deriveDashboard } from './dashboard';
import type { DashboardContext } from './pages/DashboardContext';
import { useDashboardData } from './useDashboardData';

/**
 * De schil om alle pagina's heen.
 *
 * De gegevens worden hier een keer opgehaald en berekend, en daarna via de
 * router doorgegeven aan de pagina die open staat. Zou elke pagina dat zelf
 * doen, dan had elke pagina zijn eigen kopie en las elke pagina de opslag
 * opnieuw uit.
 *
 * Meldingen staan ook hier: die gaan over een handeling en niet over een
 * pagina, dus je wil ze zien welk tabblad je ook opent.
 */
function App() {
    const data = useDashboardData();
    const view = deriveDashboard(
        data.transactions,
        data.overrides,
        data.manualQuotes,
        ownershipConfig,
    );

    const context: DashboardContext = { data, view };

    return (
        <>
            <PageHeader />
            <NavTabs />

            <main className="container py-4">
                {data.error && (
                    <div className="alert alert-danger" role="alert">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {data.error}
                    </div>
                )}

                {data.notice && (
                    <div className="alert alert-success" role="alert">
                        <i className="bi bi-check-circle me-2"></i>
                        {data.notice}
                    </div>
                )}

                {view.ownershipError && (
                    <div className="alert alert-danger" role="alert">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {view.ownershipError}
                    </div>
                )}

                {data.loading ? (
                    <p className="text-muted">Opgeslagen gegevens inladen...</p>
                ) : (
                    <Outlet context={context} />
                )}
            </main>
        </>
    );
}

export default App;
