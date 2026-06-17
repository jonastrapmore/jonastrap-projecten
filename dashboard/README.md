# Dashboard Project: Persoonlijk Dashboard met API-integraties

**Auteur:** Jonas Trap
**Opleiding:** Graduaat Programmeren, Thomas More Geel
**Jaar:** 2025-2026

---

## Doelstelling

Het doel van dit project is het bouwen van een persoonlijk dashboard als webapplicatie. Dit dashboard brengt vier dagelijkse noden samen op een centrale pagina: het actuele weerbericht voor opgeslagen locaties, een dagelijks budget-vriendelijk avondmaalrecept, een weekoverzicht van de Outlook-agenda, en een eenvoudig takenbeheer voor schoolgerelateerde notities.

Het project sluit de eerste fase van de opleiding af en dient als demonstratiestuk van de verworven vaardigheden in webontwikkeling en API-integratie. De nadruk ligt op een nette, professionele uitwerking die de geleerde concepten concreet toepast in een realistisch gebruik.

---

## Technische Keuzes

### Framework en tooling

| Technologie   | Keuze           | Reden                                                     |
| ------------- | --------------- | --------------------------------------------------------- |
| Build tool    | Vite            | Snelle ontwikkelomgeving, native TypeScript-ondersteuning |
| Taal          | TypeScript      | Type-veiligheid, betere onderhoudbaarheid                 |
| CSS-framework | Bootstrap 5     | Bekende basis, uitstekende grid en dark mode              |
| Iconen        | Bootstrap Icons | Consistent met Bootstrap, groot aanbod                    |

### Architectuur

De applicatie volgt dezelfde patroonstructuur als het eerder gemaakte portfolioproject:

- **Custom Elements**: elk widget is een zelfstandige webcomponent die zijn eigen data beheert
- **Pages**: een centrale dashboardpagina organiseert de vier widgets in een raster
- **Router**: single-page application met client-side routing
- **Persistence Providers**: een abstractielaag voor dataopslag met twee implementaties

```
src/
  components/        Herbruikbare webcomponenten (widgets, navbar)
  data/              Persistence providers (abstract, localStorage, memory)
  effects/           Neveneffecten zoals thema-beheer
  models/            TypeScript interfaces voor datamodellen
  pages/             Paginaklassen (dashboard)
  router/            Router, Page en CustomElement basisklassen
```

### Dataopslag

- Weerslocaties worden opgeslagen in `localStorage` zodat eerder ingegeven plaatsnamen of postcodes bewaard blijven na het sluiten van de browser.
- Taken worden opgeslagen in `localStorage` en blijven beschikbaar na het herladen van de pagina.
- API-sleutels worden bewaard in een `.env`-bestand en nooit meegeleverd in de broncode.

---

## Widgets: Beschrijving en Functionaliteit

### Widget 1: Weer

**Positie in raster:** linksboven

**API:** OpenWeatherMap (https://openweathermap.org)

**Gratis tier:** 1.000 API-aanvragen per dag

**Functionaliteit:**

- Invoerveld voor plaatsnaam of Belgische postcode
- Opgeslagen locaties worden weergegeven als klikbare chips
- Huidige temperatuur, omschrijving, luchtvochtigheid, windsnelheid en gevoelstemperatuur
- Automatisch vernieuwen elke 60 minuten

**Technische aanpak:**

- Locaties worden opgeslagen via `LocalStoragePersistenceProvider`
- API-aanvraag via de browser `fetch` API
- API-sleutel via Vite omgevingsvariabele `VITE_OPENWEATHER_API_KEY`

---

### Widget 2: Menu van de Dag

**Positie in raster:** rechtsboven

**API:** TheMealDB (https://www.themealdb.com)

**Gratis:** geen API-sleutel vereist

**Functionaliteit:**

- Toont een willekeurig avondmaalrecept bij het laden van de pagina
- Filteropties: Keto, Low Calorie, Budget
- Afbeelding van het gerecht, naam, categorie en ingredientenlijst
- Link naar het volledige recept en een video van de bereiding
- Knop om een ander recept te laden

**Technische aanpak:**

- Willekeurig recept via `https://www.themealdb.com/api/json/v1/1/random.php`
- Gefilterde recepten via categorie-endpoint
- Geen opslag vereist

---

### Widget 3: Outlook Agenda

**Positie in raster:** linksonder (breed)

**API:** Microsoft Graph API (https://graph.microsoft.com)

**Authenticatie:** MSAL.js via OAuth2

**Vereiste toestemming:** `Calendars.Read` (gedelegeerd recht)

**Functionaliteit:**

- Weekoverzicht van maandag tot en met zondag
- Navigeren naar de vorige of volgende week
- Knop om terug te keren naar de huidige week
- Aanmeldknop die de Microsoft OAuth-flow start

**Technische aanpak:**

- Azure AD-applicatieregistratie vereist (is aangevraagd bij de beheerder)
- MSAL.js bibliotheek voor authenticatie
- Kalendergebeurtenissen via Graph `calendarView` endpoint
- Client ID via Vite omgevingsvariabele `VITE_MSAL_CLIENT_ID`

---

### Widget 4: Taken

**Positie in raster:** rechtsonder

**API:** geen, enkel lokale opslag

**Functionaliteit:**

- Taken aanmaken via invoerveld (Enter of knop)
- Taken afvinken en als voltooid markeren
- Taken verwijderen
- Voltooide taken in een keer verwijderen
- Filter op: alle taken, openstaande taken, voltooide taken
- Teller met het aantal openstaande taken

**Technische aanpak:**

- Opslag via `LocalStoragePersistenceProvider` met het `Task` model
- Observer-patroon voor automatisch herrenderen na wijzigingen

---

## Gebruikte API-overzicht

| Widget | API             | Gratis         | Registratie                        |
| ------ | --------------- | -------------- | ---------------------------------- |
| Weer   | OpenWeatherMap  | Ja (1.000/dag) | API-sleutel via openweathermap.org |
| Recept | TheMealDB       | Ja (onbeperkt) | Geen                               |
| Agenda | Microsoft Graph | Ja             | Azure AD-applicatieregistratie     |
| Taken  | localStorage    | n.v.t.         | Geen                               |

---

## Projectplanning

### Fase 1: Projectopzet

**Geschatte duur:** 1 sessie

- Initialisatie van Vite, TypeScript en Bootstrap
- Overzetten van herbruikbare infrastructuur (Router, Page, CustomElement, providers)
- Opzetten van de dashboardpagina met 2x2-rasterlay-out
- Configuratie van het thema-systeem (licht/donker)

**Status:** Afgerond - structuur aangemaakt

---

### Fase 2: Widget Weer

**Geschatte duur:** 2 sessies

- OpenWeatherMap API-sleutel aanvragen en configureren
- Weerdata ophalen op basis van plaatsnaam en Belgische postcode
- Opgeslagen locaties beheren via LocalStoragePersistenceProvider
- UI invullen met temperatuur, icoon en detailgegevens
- Automatische vernieuwing implementeren

---

### Fase 3: Widget Recept

**Geschatte duur:** 2 sessies

- Integratie met TheMealDB
- Willekeurig recept ophalen en weergeven
- Filterlogica implementeren voor Keto, Low Calorie en Budget
- Ingredientenlijst en externe links verwerken

---

### Fase 4: Widget Taken

**Geschatte duur:** 1 sessie

- Taken aanmaken, afvinken en verwijderen
- Filterweergave (alle, open, voltooid) implementeren
- Observer-koppeling met de persistence provider voltooien

---

### Fase 5: Widget Agenda

**Geschatte duur:** 3 tot 4 sessies

- Azure AD-applicatie registreren op portal.azure.com
- MSAL.js integreren als npm-pakket
- OAuth2-authenticatiestroom implementeren
- Microsoft Graph API aanroepen voor kalendergebeurtenissen
- Weekraster renderen met dag-kolommen en evenementen

---

### Fase 6: Afwerking en Validatie

**Geschatte duur:** 1 tot 2 sessies

- Responsiviteit testen op mobiel, tablet en desktop
- Donker- en lichtthema finetunen per widget
- Foutafhandeling toevoegen voor API-aanvragen (netwerk, ongeldige sleutel, geen resultaat)
- Code opschonen, commentaar aanvullen

---

## Veiligheid

- API-sleutels worden nooit hardgecodeerd in de broncode of meegeleverd in versiebeheer
- Sleutels worden bewaard in een `.env`-bestand dat is opgenomen in `.gitignore`
- De Microsoft Graph-authenticatie verloopt via OAuth2 met MSAL.js, zonder dat tokens lokaal worden opgeslagen
- Alle externe links in de receptwidget krijgen `rel="noopener noreferrer"` om tab-nabbing te voorkomen

---

## Setup-instructies

1. Kloon of open de projectmap in VS Code
2. Installeer de dependencies: `npm install`
3. Maak een `.env`-bestand aan in de root met de volgende variabelen:

```
VITE_OPENWEATHER_API_KEY=jouw_sleutel_hier
VITE_MSAL_CLIENT_ID=jouw_azure_client_id_hier
```

4. Start de ontwikkelserver: `npm run dev`
5. Open `http://localhost:5173` in de browser
