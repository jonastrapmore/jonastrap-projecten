/// <reference types="vite/client" />
import { locationsLocalStorageProvider } from '../../data/data.ts';
import { SavedLocation } from '../../models/savedLocation.ts';
import { CustomElement } from '../../router/customElement.ts';
import HTML from './weatherWidget.html?raw';

// Vorm van het antwoord van het "current weather"-endpoint (alleen de velden die we gebruiken)
interface WeatherResponse {
    name: string;
    main: {
        temp: number;
        feels_like: number;
        humidity: number;
    };
    weather: {
        description: string;
        icon: string;
        main: string;
    }[];
    wind: {
        speed: number;
    };
}

// Vorm van het antwoord van het "forecast"-endpoint: een lijst met intervallen van 3 uur
interface ForecastResponse {
    list: {
        dt_txt: string; // tijdstip in UTC, bv. "2026-06-24 12:00:00"
        main: { temp: number };
        weather: { icon: string }[];
    }[];
}

// Weerwidget: huidig weer ophalen via OpenWeatherMap, opgeslagen locaties als chips,
// en een 5-daagse voorspelling. Locaties worden bewaard via de provider met observer-patroon.
export class WeatherWidget extends CustomElement {
    // Referenties naar de HTML-elementen in weatherWidget.html
    #weatherInput = this.componentBody.querySelector<HTMLInputElement>('#weather-input')!;
    #weatherSearchBtn = this.componentBody.querySelector<HTMLButtonElement>('#weather-search')!;
    #weatherRefreshBtn = this.componentBody.querySelector<HTMLButtonElement>('#weather-refresh')!;
    #weatherTemp = this.componentBody.querySelector<HTMLDivElement>('#weather-temp')!;
    #weatherDesc = this.componentBody.querySelector<HTMLDivElement>('#weather-desc')!;
    #weatherIcon = this.componentBody.querySelector<HTMLDivElement>('#weather-icon')!;
    #weatherHumidity = this.componentBody.querySelector<HTMLDivElement>('#weather-humidity')!;
    #weatherWind = this.componentBody.querySelector<HTMLDivElement>('#weather-wind')!;
    #weatherFeels = this.componentBody.querySelector<HTMLDivElement>('#weather-feels')!;
    #weatherLastUpdate = this.componentBody.querySelector<HTMLSpanElement>('#weather-last-update')!;
    #weatherForecast = this.componentBody.querySelector<HTMLDivElement>('#weather-forecast')!;
    #weatherSavedLocations = this.componentBody.querySelector<HTMLDivElement>(
        '#weather-saved-locations',
    )!;
    #weatherError = this.componentBody.querySelector<HTMLDivElement>('#weather-error')!;
    #weatherErrorText = this.componentBody.querySelector<HTMLSpanElement>('#weather-error-text')!;

    // Lokale kopie van de opgeslagen locaties (wordt door de observer bijgewerkt)
    #locations: SavedLocation[] = [];
    // De officiele naam van de locatie die nu getoond wordt (om de juiste chip te markeren)
    #activeName = '';
    // De zoekterm van de actieve locatie (om te kunnen vernieuwen)
    #activeQuery = '';

    constructor() {
        super(HTML);

        // Zoeken via de knop of de Enter-toets
        this.#weatherSearchBtn.addEventListener('click', () => this.#weatherSearch());
        this.#weatherInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.#weatherSearch();
            }
        });

        // Observer: bij elke wijziging in de opgeslagen locaties de chips opnieuw renderen
        locationsLocalStorageProvider.addObserver((locations) => {
            this.#locations = locations;
            this.#renderlocations();
        });

        // Eerder opgeslagen locaties meteen tonen bij het laden
        locationsLocalStorageProvider.getAll();

        // Vernieuwknop: de actieve locatie opnieuw ophalen
        this.#weatherRefreshBtn.addEventListener('click', () => {
            if (this.#activeQuery) {
                this.#getWeather(this.#activeQuery).catch(() =>
                    this.#showError('Kon het weer niet vernieuwen. Probeer het later opnieuw.'),
                );
            }
        });
    }

    // Afhandeling van de zoekactie: invoer lezen, weer ophalen en de locatie opslaan
    async #weatherSearch() {
        const location = this.#weatherInput.value.trim();

        if (location === '') {
            return;
        }

        try {
            const data = await this.#getWeather(location);

            // Controleer of deze locatie al bestaat (op officiele naam), zodat we geen dubbels opslaan
            const exists = this.#locations.some(
                (loc) => loc.name.toLowerCase() === data.name.toLowerCase(),
            );

            if (!exists) {
                await locationsLocalStorageProvider.create({
                    name: data.name,
                    query: location,
                });
            }

            this.#weatherInput.value = '';
        } catch (error) {
            // Onbekende plaats of netwerkfout: toon een melding aan de gebruiker
            console.error(error);
            this.#showError('Locatie niet gevonden. Controleer de plaatsnaam of postcode.');
        }
    }

    // Haalt het huidige weer op, toont het en start ook de voorspelling
    async #getWeather(query: string) {
        // Eventuele oude foutmelding verbergen bij een nieuwe poging
        this.#weatherError.classList.add('d-none');

        const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${query}&appid=${apiKey}&units=metric&lang=nl`,
        );
        if (!response.ok) {
            throw new Error(`Locatie niet gevonden (status ${response.status})`);
        }

        const data: WeatherResponse = await response.json();
        this.#activeQuery = query;
        this.#showWeather(data);
        // Voorspelling apart ophalen; een fout hier mag het huidige weer niet onderuit halen
        this.#getForecast(query).catch((error) => console.error(error));
        return data;
    }

    // Haalt de 5-daagse voorspelling op en toont ze
    async #getForecast(query: string) {
        const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${query}&appid=${apiKey}&units=metric&lang=nl`,
        );
        if (!response.ok) {
            throw new Error(`Locatie niet gevonden (status ${response.status})`);
        }

        const data: ForecastResponse = await response.json();
        this.#activeQuery = query;
        this.#showForecast(data);
        return data;
    }

    // Vult de weergave met het huidige weer
    #showWeather(data: WeatherResponse) {
        this.#weatherTemp.textContent = `${Math.round(data.main.temp)}°`;
        this.#weatherDesc.textContent = data.weather[0].description;
        this.#weatherHumidity.textContent = `${Math.round(data.main.humidity)}%`;
        this.#weatherFeels.textContent = `${Math.round(data.main.feels_like)}°`;
        // wind.speed is in meter per seconde, omrekenen naar km/u
        this.#weatherWind.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
        this.#weatherLastUpdate.textContent = new Date().toLocaleTimeString('nl-BE', {
            hour: '2-digit',
            minute: '2-digit',
        });
        this.#weatherIcon.textContent = this.#weatherEmoji(data.weather[0].icon);

        // Onthoud welke locatie actief is en herteken de chips zodat de juiste oplicht
        this.#activeName = data.name;
        this.#renderlocations();
    }

    // Bouwt de chips van de opgeslagen locaties opnieuw op
    #renderlocations() {
        this.#weatherSavedLocations.innerHTML = '';

        this.#locations.forEach((location) => {
            const locationChip = this.#createLocationChip(location);
            this.#weatherSavedLocations.appendChild(locationChip);
        });
    }

    // Maakt een klikbare chip voor één opgeslagen locatie (met verwijderknop)
    #createLocationChip(location: SavedLocation): HTMLSpanElement {
        const locationSpan = document.createElement('span');
        locationSpan.className = 'location-chip';
        locationSpan.dataset.id = location.id;

        // De actieve locatie krijgt een accentkleur
        if (location.name === this.#activeName) {
            locationSpan.classList.add('active');
        }

        // Klik op de chip toont het weer van die locatie (met foutmelding als het mislukt)
        locationSpan.addEventListener('click', () => {
            this.#getWeather(location.query).catch(() =>
                this.#showError('Kon het weer voor deze locatie niet laden.'),
            );
        });

        const locationNameSpan = document.createElement('span');
        locationNameSpan.className = 'chip-name';
        locationNameSpan.textContent = location.name;

        // Verwijderknop met kruisje
        const locationDeleteBtn = document.createElement('button');
        locationDeleteBtn.type = 'button';
        locationDeleteBtn.className = 'chip-delete';
        locationDeleteBtn.ariaLabel = 'Locatie verwijderen';

        locationDeleteBtn.addEventListener('click', (e) => {
            // Voorkom dat de klik ook de chip-klik (en dus een fetch) afvuurt
            e.stopPropagation();
            // Verwijderen we de actieve locatie? Maak dan de weergave leeg
            if (location.name === this.#activeName) {
                this.#activeName = '';
                this.#clearWeather();
            }
            locationsLocalStorageProvider.delete(location.id);
        });

        const locationI = document.createElement('i');
        locationI.className = 'bi bi-x';

        locationDeleteBtn.appendChild(locationI);
        locationSpan.appendChild(locationNameSpan);
        locationSpan.appendChild(locationDeleteBtn);

        return locationSpan;
    }

    // Toont de 5-daagse voorspelling
    #showForecast(data: ForecastResponse) {
        // Per dag één moment kiezen: het interval van 12:00 (UTC), beperkt tot 5 dagen
        const perDag = data.list.filter((item) => item.dt_txt.includes('12:00:00')).slice(0, 5);
        this.#weatherForecast.innerHTML = '';

        perDag.forEach((dag) => {
            const dagBlok = this.#createForecastDay(dag);
            this.#weatherForecast.appendChild(dagBlok);
        });

        // Strook zichtbaar maken nu ze gevuld is
        this.#weatherForecast.classList.remove('d-none');
    }

    // Maakt het blokje voor één voorspelde dag (dag, icoon, temperatuur)
    #createForecastDay(dag: ForecastResponse['list'][number]): HTMLDivElement {
        const forecastDayDiv = document.createElement('div');
        forecastDayDiv.className = 'forecast-day';

        const dayDiv = document.createElement('div');
        dayDiv.textContent = new Date(dag.dt_txt).toLocaleDateString('nl-BE', { weekday: 'short' });

        const iconDiv = document.createElement('div');
        // In de voorspelling altijd het dag-icoon tonen (geen maan), ongeacht de UTC-tijd
        const iconCode = dag.weather[0].icon.slice(0, 2) + 'd';
        iconDiv.textContent = this.#weatherEmoji(iconCode);

        const tempDiv = document.createElement('div');
        tempDiv.className = 'forecast-temp';
        tempDiv.textContent = `${Math.round(dag.main.temp)}°`;

        forecastDayDiv.appendChild(dayDiv);
        forecastDayDiv.appendChild(iconDiv);
        forecastDayDiv.appendChild(tempDiv);

        return forecastDayDiv;
    }

    // Zet de weergave terug naar de begintoestand (bv. als de actieve locatie verwijderd wordt)
    #clearWeather() {
        this.#weatherTemp.textContent = '--';
        this.#weatherDesc.textContent = 'Geen locatie geselecteerd';
        this.#weatherHumidity.textContent = '--%';
        this.#weatherWind.textContent = '-- km/h';
        this.#weatherFeels.textContent = '--';
        this.#weatherLastUpdate.textContent = '--';
        this.#weatherIcon.textContent = '🌤️';
        this.#weatherForecast.classList.add('d-none');
    }

    // Toont een foutmelding aan de gebruiker (bv. ongeldige locatie of storing)
    #showError(bericht: string) {
        this.#weatherErrorText.textContent = bericht;
        this.#weatherError.classList.remove('d-none');
    }

    // Zet een OpenWeatherMap-icooncode om naar een passende emoji (met dag/nacht voor helder weer)
    #weatherEmoji(icon: string): string {
        const code = icon.slice(0, 2); // bv. "01" uit "01n"
        const isNight = icon.endsWith('n'); // dag of nacht?

        switch (code) {
            case '01':
                return isNight ? '🌙' : '☀️';
            case '02':
                return isNight ? '☁️' : '🌤️';
            case '03':
                return '⛅';
            case '04':
                return '☁️';
            case '09':
                return '🌧️';
            case '10':
                return '🌦️';
            case '11':
                return '⛈️';
            case '13':
                return '❄️';
            case '50':
                return '🌫️';
            default:
                return isNight ? '🌙' : '🌤️';
        }
    }
}
