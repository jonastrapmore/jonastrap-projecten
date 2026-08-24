import { NavLink } from 'react-router';

const TABS = [
    { to: '/overzicht', label: 'Overzicht', icon: 'bi-clipboard-data' },
    { to: '/fondsen', label: 'Fondsen', icon: 'bi-pie-chart' },
    { to: '/prognose', label: 'Prognose', icon: 'bi-graph-up-arrow' },
    { to: '/update', label: 'Update', icon: 'bi-arrow-repeat' },
];

/**
 * De hoofdnavigatie.
 *
 * NavLink is een gewone link die zelf weet of hij actief is. Dat scheelt het
 * bijhouden van "welk tabblad staat open": het adres is de waarheid, niet een
 * stuk state dat ernaast kan gaan lopen.
 */
export function NavTabs() {
    return (
        <nav className="border-bottom trap-bg-primary">
            <div className="container">
                <ul className="nav nav-tabs border-0">
                    {TABS.map((tab) => (
                        <li className="nav-item" key={tab.to}>
                            <NavLink
                                to={tab.to}
                                className={({ isActive }) =>
                                    `nav-link border-0 ${isActive ? 'active fw-semibold' : 'text-white-50'}`
                                }
                            >
                                <i className={`bi ${tab.icon} me-1`}></i>
                                {tab.label}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    );
}
