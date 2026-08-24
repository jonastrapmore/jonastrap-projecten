import { useOutletContext } from 'react-router';
import type { Dashboard } from '../dashboard';
import type { useDashboardData } from '../useDashboardData';

/**
 * Wat elke pagina van de schil krijgt: de opgeslagen gegevens met hun acties,
 * en alles wat daaruit berekend is.
 *
 * `data` komt uit useDashboardData en bevat state plus de handelingen
 * (uploaden, wissen, koers bewaren). `view` komt uit deriveDashboard en bevat
 * alleen uitkomsten.
 */
export type DashboardContext = {
    data: ReturnType<typeof useDashboardData>;
    view: Dashboard;
};

/**
 * Haalt die context op binnen een pagina.
 *
 * De router geeft hem door via <Outlet context={...} />. Dat is eenvoudiger dan
 * een eigen React-context opzetten, en het houdt zichtbaar dat de gegevens van
 * de schil komen en niet uit het niets.
 */
export function useDashboard(): DashboardContext {
    return useOutletContext<DashboardContext>();
}
