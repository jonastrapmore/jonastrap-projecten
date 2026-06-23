# Dashboard Project: Persoonlijk Dashboard met API-integraties

**Auteur:** Jonas Trap
**Opleiding:** Graduaat Programmeren, Thomas More Geel
**Jaar:** 2025-2026

---

## Voortgang

| Datum      | Onderdeel    | Status    | Omschrijving                                                                                                                  |
| ---------- | ------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 17/06/2026 | Projectopzet | Afgewerkt | Vite + TypeScript + Bootstrap opgezet, mapstructuur aangemaakt, router en providers overgezet, gitignore en README toegevoegd |
| 17/06/2026 | Navbar       | Afgewerkt | Klok (tikt elke seconde), datum in het Nederlands, begroeting op basis van het uur, theme toggle licht/donker                 |
| 18/06/2026 & 20/06/2026 | Takenwidget | Afgewerkt | Taken toevoegen (Enter of knop), afvinken, verwijderen, voltooide in één keer wissen, filteren (alle/open/klaar), teller van openstaande taken en lege toestand. Werkt via de LocalStorage-provider met observer-patroon |
| 21/06/2026, 22/06/2026 & 23/06/2026 | Weerwidget | Afgewerkt | Huidig weer ophalen via OpenWeatherMap (plaatsnaam of postcode), opgeslagen locaties als klikbare chips met dubbele-check en actieve markering, weericoon als emoji (dag/nacht), vernieuwknop, leegmaken bij verwijderen en een 5-daagse voorspelling. Locaties bewaard via de LocalStorage-provider met observer-patroon |

---

## Doelstelling

Het doel van dit project is het bouwen van een persoonlijk dashboard als webapplicatie. Dit dashboard brengt vier dagelijkse noden samen op een centrale pagina: het actuele weerbericht voor opgeslagen locaties, een dagelijks budget-vriendelijk avondmaalrecept, de NASA-foto van de dag met uitleg, en een eenvoudig takenbeheer voor schoolgerelateerde notities.

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

### Widget 3: NASA Foto van de Dag

**Positie in raster:** linksonder (breed)

**API:** NASA APOD - Astronomy Picture of the Day (https://api.nasa.gov)

**Gratis tier:** DEMO_KEY (beperkt aantal aanvragen) of een gratis eigen sleutel met hoger limiet

**Functionaliteit:**

- Toont de dagelijkse astronomische foto bij het laden van de pagina
- Ondersteunt zowel afbeeldingen als ingesloten video's
- Titel, datum en een korte uitleg bij de opname
- Vermelding van de auteursrechten wanneer beschikbaar

**Technische aanpak:**

- Data via het APOD-endpoint `https://api.nasa.gov/planetary/apod`
- Onderscheid tussen `media_type` "image" en "video"
- API-sleutel via Vite omgevingsvariabele `VITE_NASA_API_KEY` (valt terug op `DEMO_KEY`)

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

| Widget | API            | Gratis         | Registratie                        |
| ------ | -------------- | -------------- | ---------------------------------- |
| Weer   | OpenWeatherMap | Ja (1.000/dag) | API-sleutel via openweathermap.org |
| Recept | TheMealDB      | Ja (onbeperkt) | Geen                               |
| NASA   | NASA APOD      | Ja             | DEMO_KEY of gratis sleutel         |
| Taken  | localStorage   | n.v.t.         | Geen                               |

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

### Fase 5: Widget NASA Foto van de Dag

**Geschatte duur:** 1 sessie

- NASA APOD-endpoint aanroepen via de browser `fetch` API
- Afbeelding of ingesloten video tonen afhankelijk van `media_type`
- Titel, datum, uitleg en auteursrechten weergeven
- Foutafhandeling en laad-indicator voorzien

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
- De NASA-sleutel valt terug op `DEMO_KEY` zodat de widget ook zonder eigen sleutel werkt
- Alle externe links in de receptwidget krijgen `rel="noopener noreferrer"` om tab-nabbing te voorkomen

---

## Setup-instructies

1. Kloon of open de projectmap in VS Code
2. Installeer de dependencies: `npm install`
3. Maak een `.env`-bestand aan in de root met de volgende variabelen:

```
VITE_OPENWEATHER_API_KEY=jouw_sleutel_hier
VITE_NASA_API_KEY=jouw_nasa_sleutel_hier
```

4. Start de ontwikkelserver: `npm run dev`
5. Open `http://localhost:5173` in de browser
