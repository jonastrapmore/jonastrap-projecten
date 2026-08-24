import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Navigate, Route, Routes } from 'react-router';
import App from './App.tsx';
import './index.css';
import { ForecastJonasPage } from './pages/ForecastJonasPage';
import { ForecastLiesaPage } from './pages/ForecastLiesaPage';
import { ForecastPage } from './pages/ForecastPage';
import { FundsPage } from './pages/FundsPage';
import { OverviewPage } from './pages/OverviewPage';
import { UpdatePage } from './pages/UpdatePage';

// HashRouter en niet BrowserRouter: de adressen krijgen een hekje
// (.../#/overzicht), maar het werkt overal, ook als je de gebouwde
// index.html rechtstreeks opent. Bij gewone adressen moet een server weten
// dat elk pad naar index.html moet, en dat is gedoe voor een lokaal hulpmiddel.
createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <HashRouter>
            <Routes>
                <Route path="/" element={<App />}>
                    {/* Zonder pad kom je op het overzicht uit. */}
                    <Route index element={<Navigate to="/overzicht" replace />} />
                    <Route path="overzicht" element={<OverviewPage />} />
                    <Route path="fondsen" element={<FundsPage />} />
                    <Route path="prognose" element={<ForecastPage />}>
                        <Route index element={<Navigate to="/prognose/liesa" replace />} />
                        <Route path="liesa" element={<ForecastLiesaPage />} />
                        <Route path="jonas" element={<ForecastJonasPage />} />
                    </Route>
                    <Route path="update" element={<UpdatePage />} />
                    {/* Een onbekend adres stuurt terug naar het overzicht in
                        plaats van een leeg scherm te tonen. */}
                    <Route path="*" element={<Navigate to="/overzicht" replace />} />
                </Route>
            </Routes>
        </HashRouter>
    </StrictMode>,
);
