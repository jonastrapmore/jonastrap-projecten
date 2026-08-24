import { NavLink, Outlet } from 'react-router';
import { useDashboard } from './DashboardContext';

const SUBTABS = [
    { to: '/prognose/liesa', label: 'Liesa' },
    { to: '/prognose/jonas', label: 'Jonas' },
];

/**
 * Schil voor de prognose, met een tabblad per persoon.
 *
 * De <Outlet> hieronder is de plek waar de router de gekozen subpagina tekent.
 * De context wordt doorgegeven, zodat die subpagina's bij dezelfde gegevens
 * kunnen als de rest.
 */
export function ForecastPage() {
    const context = useDashboard();

    return (
        <>
            <ul className="nav nav-pills mb-4">
                {SUBTABS.map((tab) => (
                    <li className="nav-item" key={tab.to}>
                        <NavLink
                            to={tab.to}
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            {tab.label}
                        </NavLink>
                    </li>
                ))}
            </ul>

            <Outlet context={context} />
        </>
    );
}
