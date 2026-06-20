import 'bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/css/bootstrap.css';
import './style.css';

import { Router } from './router/router';

import { NasaWidget } from './components/nasaWidget/nasaWidget';
import { CustomNavbar } from './components/navbar/navbar';
import { NotesWidget } from './components/notesWidget/notesWidget';
import { RecipeWidget } from './components/recipeWidget/recipeWidget';
import { WeatherWidget } from './components/weatherWidget/weatherWidget';

import { DashboardPage } from './pages/dashboard/dashboard';

import { initTheme } from './effects/theme';

// Registreer alle custom elements
window.customElements.define('custom-navbar', CustomNavbar);
window.customElements.define('widget-weather', WeatherWidget);
window.customElements.define('widget-recipe', RecipeWidget);
window.customElements.define('widget-nasa', NasaWidget);
window.customElements.define('widget-notes', NotesWidget);

initTheme();

// Koppel routes aan pagina-klassen
new Router({
    '/': DashboardPage,
});
