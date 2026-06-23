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
| 23/06/2026 | Receptwidget | Afgewerkt | Willekeurig recept via Spoonacular met filters voor Keto, Low Calorie en Snel klaar, vertaalde naam en ingredienten (Google met MyMemory-fallback), badges voor categorie, keuken, calorieën, koolhydraten en prijs, een laadscherm en een link naar het volledige recept. Geen opslag nodig |
| 23/06/2026 | NASA-widget | Afgewerkt | Foto of video van de dag via NASA APOD, titel en uitleg vertaald naar het Nederlands, afbeelding/YouTube/Vimeo/direct videobestand met thumbnail-terugval, automatische herhaling bij een tijdelijke NASA-storing en een foutmelding. Gebruikt de gedeelde vertaalhulp |

---

## Doelstelling

Het doel van dit project is het bouwen van een persoonlijk dashboard als webapplicatie. Dit dashboard brengt vier dagelijkse noden samen op een centrale pagina: het actuele weerbericht voor opgeslagen locaties, een dagelijks avondmaalrecept met filters voor dieet en bereidingstijd, de NASA-foto van de dag met uitleg, en een eenvoudig takenbeheer voor schoolgerelateerde notities.

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
  effects/           Neveneffecten zoals thema-beheer en de gedeelde vertaalhulp
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
- Opgeslagen locaties worden weergegeven als klikbare chips, met verwijderknop en markering van de actieve locatie
- Huidige temperatuur, omschrijving, luchtvochtigheid, windsnelheid en gevoelstemperatuur
- Weericoon als emoji (met onderscheid tussen dag en nacht)
- 5-daagse voorspelling onderaan de kaart
- Vernieuwknop om de gegevens handmatig te verversen
- Foutmelding bij een ongeldige locatie of een storing

**Technische aanpak:**

- Locaties worden opgeslagen via `LocalStoragePersistenceProvider` met het `SavedLocation` model en het observer-patroon
- Huidig weer via het `weather`-endpoint en de voorspelling via het `forecast`-endpoint, opgehaald met de browser `fetch` API
- API-sleutel via Vite omgevingsvariabele `VITE_OPENWEATHER_API_KEY`

---

### Widget 2: Menu van de Dag

**Positie in raster:** rechtsboven

**API:** Spoonacular (https://spoonacular.com/food-api)

**Gratis tier:** ja, met een dagelijkse puntenlimiet (gratis API-sleutel vereist)

**Functionaliteit:**

- Toont een willekeurig recept bij het laden van de pagina
- Filteropties: Keto, Low Calorie en Snel klaar (binnen 30 minuten)
- Afbeelding van het gerecht, naam, categorie en herkomst (keuken)
- Ingredientenlijst, vertaald naar het Nederlands
- Badges met calorieën, koolhydraten en de prijs per portie
- Link naar het volledige recept
- Knop om een ander recept te laden
- Nette foutmelding wanneer het dagelijkse aanvraaglimiet bereikt is of er geen recept past bij de filters

**Technische aanpak:**

- Recepten via het `complexSearch`-endpoint, opgehaald met de browser `fetch` API
- Filters als parameters: `diet=ketogenic` (keto), `maxCalories` (low calorie) en `maxReadyTime` (snel klaar), gecombineerd met een willekeurige `cuisine` voor de herkomst
- Voedingswaarde en prijs via `addRecipeNutrition`
- Inhoud wordt naar het Nederlands vertaald via de gedeelde vertaalhulp (`effects/translate.ts`), die eerst Google probeert en terugvalt op MyMemory
- API-sleutel via Vite omgevingsvariabele `VITE_SPOONACULAR_API_KEY`
- Geen opslag vereist

---

### Widget 3: NASA Foto van de Dag

**Positie in raster:** linksonder (breed)

**API:** NASA APOD - Astronomy Picture of the Day (https://api.nasa.gov)

**Gratis tier:** DEMO_KEY (beperkt aantal aanvragen) of een gratis eigen sleutel met hoger limiet

**Functionaliteit:**

- Toont de astronomische foto of video van de dag bij het laden van de pagina
- Titel en uitleg vertaald naar het Nederlands
- Datum van de opname en de auteursrechten (indien beschikbaar)
- Ondersteunt afbeeldingen, ingesloten YouTube/Vimeo-video's en directe videobestanden (.mp4)
- Automatische herhaling bij een tijdelijke NASA-storing, en een nette foutmelding wanneer het echt niet lukt

**Technische aanpak:**

- Data via het APOD-endpoint `https://api.nasa.gov/planetary/apod` (met `thumbs=true` voor een poster bij video's)
- Mediakeuze op basis van `media_type` en het url-type: een iframe voor YouTube/Vimeo, een HTML5 `<video>`-element voor directe bestanden, anders de thumbnail
- Titel en uitleg vertaald via de gedeelde vertaalhulp (`effects/translate.ts`)
- Automatische herhaling bij een tijdelijke serverfout (5xx)
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
| Recept | Spoonacular    | Ja (daglimiet) | API-sleutel via spoonacular.com    |
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
- Vernieuwknop en 5-daagse voorspelling toevoegen

**Status:** Afgerond

---

### Fase 3: Widget Recept

**Geschatte duur:** 2 sessies

- Integratie met Spoonacular
- Willekeurig recept ophalen en weergeven
- Filterlogica implementeren voor Keto, Low Calorie en Snel klaar
- Ingredientenlijst, voedingswaarde-badges en de gedeelde vertaalhulp verwerken

**Status:** Afgerond

---

### Fase 4: Widget Taken

**Geschatte duur:** 1 sessie

- Taken aanmaken, afvinken en verwijderen
- Filterweergave (alle, open, voltooid) implementeren
- Observer-koppeling met de persistence provider voltooien

**Status:** Afgerond

---

### Fase 5: Widget NASA Foto van de Dag

**Geschatte duur:** 1 sessie

- NASA APOD-endpoint aanroepen via de browser `fetch` API
- Afbeelding, YouTube/Vimeo-video of direct videobestand tonen afhankelijk van het type
- Titel, datum, uitleg en auteursrechten weergeven, met titel en uitleg vertaald via de gedeelde vertaalhulp
- Foutafhandeling, laad-indicator en automatische herhaling bij een tijdelijke storing voorzien

**Status:** Afgerond

---

### Fase 6: Afwerking en Validatie

**Geschatte duur:** 1 tot 2 sessies

- Responsiviteit testen op mobiel, tablet en desktop
- Donker- en lichtthema finetunen per widget
- Foutafhandeling toevoegen voor API-aanvragen (netwerk, ongeldige sleutel, geen resultaat)
- Code opschonen, commentaar aanvullen

**Status:** Afgerond

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
VITE_SPOONACULAR_API_KEY=jouw_spoonacular_sleutel_hier
VITE_NASA_API_KEY=jouw_nasa_sleutel_hier
```

4. Start de ontwikkelserver: `npm run dev`
5. Open `http://localhost:5173` in de browser
