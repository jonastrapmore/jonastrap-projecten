# Kerkom Registratie: Gegevenscontrole Petanqueclub Kerkom

**Auteur:** Jonas Trap
**Type:** Eigen/persoonlijk project (buiten de opleiding om)

---

## Over dit project

Petanqueclub Kerkom haalt de ledengegevens (naam, adres, telefoon, GSM, e-mail, ...) op bij **PFV** (Petanque Federatie Vlaanderen). Die gegevens staan daar echter niet altijd meer up-to-date: leden verhuizen, veranderen van nummer, enzovoort.

Dit project is een klein webformulier waarmee elk lid zijn eigen gegevens kan opzoeken op licentienummer, controleren en zo nodig verbeteren. Zo krijgt de club een overzicht van wat er precies moet aangepast worden bij PFV, in plaats van dat manueel bij iedereen na te vragen.

Dit is geen schoolopdracht, maar een eigen project dat op één avond in elkaar gezet is om een concreet, praktisch probleem van de club op te lossen.

---

## Werking

1. **Opzoeken** - het lid geeft zijn licentienummer in en klikt op "Zoeken". De gegevens worden opgehaald uit `data/members.json`.
2. **Controleren** - als er een match is, verschijnt een formulier met de huidige gegevens, klaar om na te kijken of aan te passen.
3. **Opslaan** - bij een klik op "Opslaan" worden de gegevens naar `php/save.php` gestuurd. Die vergelijkt oud met nieuw, normaliseert elk veld naar een vaste structuur (bv. achternaam in hoofdletters, telefoonnummer zonder spaties, datum als DD-MM-JJJJ) en schrijft het resultaat weg in `data/members.json`.
4. Elke opslagactie wordt ook bijgehouden in `data/log.json`, een append-only logbestand met wie wat wanneer heeft aangepast. Zo kan achteraf snel opgelijst worden welke leden effectief iets gewijzigd hebben, zodat enkel dat verschil moet doorgegeven worden aan PFV.

Een lid dat niets moet wijzigen, klikt gewoon toch op "Opslaan": dat bevestigt dat de gegevens gecontroleerd en in orde zijn (status `OK`). Was er wel een wijziging, dan komt de status op `UPDATED` te staan en blijft die staan totdat de gegevens effectief bij PFV aangepast zijn.

---

## Technische keuzes

Bewust gekozen voor een minimale, framework-loze aanpak, aangezien het om één eenvoudig formulier gaat:

| Onderdeel | Keuze | Reden |
| --- | --- | --- |
| Frontend | Gewone HTML, CSS en JavaScript (geen framework) | `document.getElementById`, `fetch` en een paar eventlisteners volstaan voor dit formulier |
| Backend | PHP | Draait standaard op de bestaande Combell-hosting van de club, geen extra server nodig |
| Opslag | JSON-bestanden (`members.json`, `log.json`) | Geen database nodig voor een beperkte ledenlijst; makkelijk in te lezen en aan te passen |
| Stijl | Zwart/wit, lettertype "Inter" | Overgenomen van de huisstijl van [pckerkom.com](https://pckerkom.com) |

Alle bestandspaden (CSS, JS, `fetch`-aanroepen) zijn bewust **relatief** opgebouwd, zodat de site zonder aanpassingen als submap ergens in de bestaande mapstructuur op de server geplaatst kan worden.

---

## Projectstructuur

```
kerkomRegistratie/
  index.html              Het formulier (opzoeken + controleren/opslaan)
  overzicht.html           Lokaal overzicht van de controlestatus per lid (zie hieronder)
  css/styles.css           Zwart/wit stijl, huisstijl pckerkom.com
  css/overzicht.css        Stijl specifiek voor overzicht.html
  js/script.js              Opzoeken, formulier invullen en opslaan (fetch naar save.php)
  js/overzicht.js           Logica achter overzicht.html
  php/save.php              Ontvangt en normaliseert de gegevens, schrijft members.json + log.json weg
  data/members.json         De ledenlijst die de site gebruikt (gegenereerd, zie tools/)
  data/log.json             Audit-log van alle opslagacties
  bron/ledenrapport.xls     Origineel ledenrapport, geëxporteerd vanuit PFV
  tools/convert-members.js  Zet bron/ledenrapport.xls om naar data/members.json
  images/                   Groepsfoto en Lions-foto voor de banner
```

### overzicht.html

Een extra pagina, enkel voor eigen/lokaal gebruik (niet mee naar de live hosting). Toont de volledige ledenlijst in een tabel, met een dropdown om te filteren op **Volledige lijst**, **OK**, **Updated** of **Nog niets gedaan**:

- Bij **OK** en **Updated** staan de kolommen Controlestatus en Laatst gecontroleerd in het groen.
- Bij **Updated** staan de effectief gewijzigde velden ook vetgedrukt (afgeleid uit `data/log.json`).
- Bij **Nog niets gedaan** staan diezelfde twee kolommen in het rood, en verschijnt er een knop om een CSV te downloaden met lidnummer, voornaam en naam van die leden, handig om ze gericht aan te spreken.

### tools/convert-members.js

Het ledenrapport dat je bij PFV downloadt (`bron/ledenrapport.xls`) is eigenlijk geen echt Excel-bestand, maar een HTML-tabel met de extensie `.xls`. Dit scriptje leest dat bestand in en zet het om naar `data/members.json`, het formaat dat de website effectief gebruikt:

```
node tools/convert-members.js
```

Enkel opnieuw uitvoeren bij een volledig nieuw ledenrapport vanuit PFV: het overschrijft `data/members.json` volledig, inclusief de controlestatus die leden intussen via de site hebben ingevuld.

---

## Gegevens en privacy

`data/members.json`, `data/log.json` en `bron/ledenrapport.xls` bevatten **echte persoonsgegevens** van clubleden (naam, adres, geboortedatum, telefoon, e-mail, ...). Deze bestanden staan daarom in `.gitignore` en zitten dus **niet** in deze repository.

Wie dit project kloont of download, moet deze drie bestanden dus zelf lokaal aanmaken voor het formulier werkt:

1. Zet een (nieuw) ledenrapport van PFV in `bron/ledenrapport.xls`.
2. Genereer `data/members.json` daaruit met `node tools/convert-members.js` (zie hieronder).
3. Maak een leeg `data/log.json` aan met inhoud `[]`.

---

## Lokaal draaien

Dit project heeft een PHP-server nodig (voor `php/save.php`); de HTML/CSS/JS werken niet zomaar via `file://`.

1. Zorg dat PHP lokaal geïnstalleerd is.
2. Start vanuit de projectmap een lokale server:

   ```
   php -S localhost:8000
   ```

3. Open `http://localhost:8000` in de browser.
4. Zoek een lidnummer op (zie `data/members.json` voor bestaande nummers) en test het aanpassen/opslaan.

Op de effectieve hosting (Combell) volstaat het om de projectmap als submap te plaatsen; door de relatieve paden werkt alles automatisch mee, ongeacht de locatie.
