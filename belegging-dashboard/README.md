# Beleggingsdashboard

**Auteur:** Jonas Trap
**Opleiding:** Graduaat Programmeren, Thomas More Geel
**Jaar:** 2026-2027

Een persoonlijk dashboard rond een ETF-portefeuille: huidige waarde, rendement,
verdeling over meerdere begunstigden, een overzicht voor de Belgische beurstaks
en een prognose richting twee spaardoelen.

---

## Voortgang

| Datum      | Onderdeel          | Status    | Omschrijving                                                                                                                          |
| ---------- | ------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 19/08/2026 | Projectopzet       | Afgewerkt | Vite + React + TypeScript opgezet, Bootstrap 5 en de huisstijl van jonastrap.be aangesloten, gitignore ingericht op een publieke repo |
|            | Transactiemodel    | Bezig     | Brokeronafhankelijk intern formaat voor transacties                                                                                   |
|            | CSV-parser         | Gepland   | Broker-export inlezen en omzetten naar het interne formaat                                                                            |
|            | Ledger             | Gepland   | Posities, kostprijs en rendement herberekenen uit de transacties                                                                      |
|            | Beurstaksoverzicht | Gepland   | Aangifte per periode van twee maanden, met deadlineteller                                                                             |
|            | Prognose           | Gepland   | Projectie met een band in plaats van een enkele lijn                                                                                  |
|            | Look-through       | Gepland   | Gecombineerde topposities over de fondsen heen                                                                                        |

---

## Doelstelling

Een broker levert een overzicht van wat er op je rekening staat, en daar houdt
het op. Drie dingen die ik wilde weten, kon ik nergens aflezen:

1. **Wat is van wie.** De portefeuille wordt door meer dan een persoon gevuld,
   met bedragen die per fonds verschillen en in de loop van de tijd wijzigen.
2. **Wat ben ik aan belastingen verschuldigd.** De broker in kwestie houdt de
   Belgische taks op beursverrichtingen niet in aan de bron. Die moet je zelf
   aangeven, per periode van twee maanden, met een vervaldag die snel passeert.
3. **Waar kom ik uit.** Niet als een enkel getal, maar als een bandbreedte,
   want een geconcentreerde portefeuille kan er ver naast zitten.

Dit project rekent die drie dingen uit op basis van de ruwe transacties.

---

## Technische keuzes

| Onderdeel       | Keuze           | Reden                                                                                              |
| --------------- | --------------- | -------------------------------------------------------------------------------------------------- |
| Build tool      | Vite            | Snelle ontwikkelomgeving, native TypeScript                                                        |
| Taal            | TypeScript      | Bij financiele berekeningen wil je dat het type klopt                                              |
| Framework       | React           | Bewust gekozen om vooruit te lopen op de leerstof                                                  |
| CSS             | Bootstrap 5     | Zelfde basis als mijn andere projecten                                                             |
| Componenten     | react-bootstrap | Bootstrap-gedrag als React-componenten, in plaats van de JS-bundel die rechtstreeks aan de DOM zit |
| Iconen          | Bootstrap Icons | Consistent met Bootstrap                                                                           |
| Package manager | pnpm            | Strenge node_modules: je kunt alleen importeren wat je zelf hebt toegevoegd                        |

### Waarom React

Mijn vorige projecten gebruiken custom elements met een eigen router en
persistence providers. Dat werkt, maar veel van die code is boekhouding over de
DOM: bij elke wijziging zelf de juiste elementen opzoeken en bijwerken.

React draait dat om. Je beschrijft hoe het scherm eruitziet bij een bepaalde
toestand, en het framework bepaalt wat er moet veranderen. Voor dit dashboard
scheelt dat veel, want dezelfde waarde staat op meerdere plaatsen tegelijk: in
een totaal, per fonds, per begunstigde en in de prognose. Die synchroon houden
is precies het werk dat wegvalt.

De huisstijl van jonastrap.be komt uit gewone CSS. Die gaat ongewijzigd mee, dus
het dashboard sluit visueel aan bij de rest zonder dat het framework hetzelfde
moet zijn.

---

## Datamodel

Vijf beslissingen die de rest van het project sturen.

**1. Het transactieoverzicht is de enige waarheid.**
Posities, kostprijs en rendement worden altijd herberekend uit de transacties.
Er wordt nooit een afgeleide waarde opgeslagen. Klopt er iets niet, dan zit de
fout in de berekening en niet in een verouderd veld dat iemand vergeten is bij
te werken.

**2. Broker als veld vanaf dag een.**
Er is nu maar een broker, maar het interne formaat weet daar niets van. Per
broker komt er een aparte parser die naar dat gemeenschappelijke formaat
vertaalt. Een tweede broker toevoegen is dan een parser erbij en geen
verbouwing.

**3. Kosten als aparte dimensie.**
Commissie, taksen en wisselkosten worden apart bijgehouden en niet verrekend in
de kostprijs. Zo blijft het nettorendement zichtbaar en kan het
belastingoverzicht uit dezelfde gegevens gegenereerd worden.

**4. Eigendomsverdeling als inlegregel met ingangsdatum.**
Niet als vast percentage, maar als bedragen die gelden vanaf een datum. Een
aankoop wordt gesplitst in _aandelen_: wie een derde van het bedrag inlegde,
krijgt een derde van de aandelen uit die transactie. Per persoon per fonds
worden die aandelen opgeteld, en het eigendomspercentage wordt daaruit afgeleid
in plaats van opgeslagen.

Wijzigt de verdeling, dan komt er een regel bij en wordt er niets herrekend:
oude transacties houden hun oude regel. Dat is getoetst aan een verdeling die
over tien jaar verandert plus een jaarlijkse storting buiten het maandpatroon,
en kostte een regel configuratie.

**5. Taks afronden per verrichting.**
Het plafond geldt per verrichting en niet per aangifte. Eerst per verrichting
afronden, dan pas optellen.

---

## Rekenen met geld

Nooit met kommagetallen. De reden is bekend maar wordt makkelijk onderschat:

```
0.1 + 0.2                  =  0.30000000000000004
12 keer 7.81 opgeteld      =  93.72000000000001
```

Piepklein, maar het stapelt op, en bij een belastingaangifte die je overtypt wil
je geen afrondingsruis in je totaal.

Daarom worden bedragen bijgehouden als **geheel aantal centen**, en aantallen
als **geheel getal maal 100.000.000** (de broker werkt met fractionele aandelen
tot acht decimalen). Een gewone `number` volstaat daarvoor: die is exact voor
gehele getallen tot ruim negen biljard. `BigInt` is hier onnodig en kost je
`JSON.stringify`, gemengde rekenkunde en deling zonder rest.

De schaal staat in de veldnaam (`quantityE8`). Zo is aan de aanroepende code te
zien dat het om een geschaald getal gaat.

---

## De beurstaks

De taks op beursverrichtingen kent verschillende tarieven. Het hoogste tarief
geldt uitsluitend voor kapitalisatieaandelen waarvan het **compartiment** is
ingeschreven op de FSMA-lijst van openbare instellingen voor collectieve
belegging naar buitenlands recht.

Dat woord "compartiment" doet het werk. De lijst werkt per compartiment en niet
per umbrella. Een fondsenfamilie kan dus op de lijst staan terwijl het
compartiment waarin je belegt er niet op voorkomt, en dan geldt het lage tarief.
Dat is precies het soort detail waar je een factor tien in kunt verschieten.

Omdat de status van een compartiment kan wijzigen, en omdat de status op de
**transactiedatum** telt en niet die van vandaag, wordt het tarief bewaard als
configuratie per ISIN met een ingangsdatum. Niet hardgecodeerd.

De aangifte moet gebeuren uiterlijk de laatste werkdag van de tweede maand na de
verrichting. Het dashboard genereert daarom een overzicht per periode van twee
maanden, klaar om over te typen, met een teller tot de vervaldag.

---

## De broker-export en zijn valkuilen

Er is geen publieke API voor particuliere rekeningen, dus de data komt uit een
handmatige CSV-export. Die is minder rechttoe rechtaan dan hij lijkt. Alles
hieronder is geverifieerd tegen een echte export en niet aangenomen:

- **Het transactietype heet niet wat je verwacht.** Een aankoop staat er als
  `BUY - MARKET` en niet als `BUY`. Filteren op de korte vorm matcht nul rijen
  en levert stil een lege portefeuille op, zonder enige foutmelding.
- **Bedragen hebben niet altijd decimalen.** Naast `EUR 6332.07` komt ook
  `EUR 100` voor. Splitsen op het punt en twee delen verwachten gaat mis.
- **Elke aankoop heeft een storting van hetzelfde bedrag ervoor.** Tel je beide
  mee als ingelegd kapitaal, dan verdubbelt je inleg.
- **Die storting komt niet altijd vlak ervoor.** De gemeten verschillen lopen
  van een seconde tot negentien uur, dus koppelen op tijd is geen goed idee.
- **Er is geen transactie-ID.** De sleutel wordt de combinatie van tijdstip,
  ticker, type en bedrag.
- **De tijdstempels hebben niet allemaal dezelfde precisie.** Stortingen staan
  in microseconden, aankopen in milliseconden. Omdat `new Date()` afkapt naar
  milliseconden, wordt de ruwe tekst bewaard voor de sleutel en de `Date` alleen
  gebruikt om te sorteren en te filteren.

Onbekende transactietypes laten de parser **hard falen**. Stil overslaan
betekent dat er ooit transacties uit je berekening verdwijnen zonder dat iets je
waarschuwt, en bij een berekening waar een belastingaangifte uit rolt is dat de
slechtste denkbare uitkomst.

---

## Privacy

Deze repository is openbaar. Er staat daarom geen enkel persoonlijk financieel
gegeven in: geen bedragen, geen posities, geen broker-exports, geen fiscale
stukken en geen namen van begunstigden.

Die scheiding is niet alleen een afspraak maar zit in de opzet:

- De `.gitignore` sluit exports, fiscale documenten, databases en lokale
  configuratie uit.
- Persoonlijke configuratie (begunstigden, inlegbedragen, richtjaren) staat in
  een genegeerd bestand, met een `.example`-versie met verzonnen waarden die wel
  meegaat. Zo blijft het project navolgbaar zonder dat er iets van mij in staat.
- De regel voor de datamap is verankerd aan de hoofdmap (`/data/` in plaats van
  `data/`), zodat `src/data/` gewoon broncode blijft.

---

## Aan de slag

```bash
pnpm install
pnpm dev
```

Voor een productiebuild:

```bash
pnpm build
pnpm preview
```

Het dashboard draait lokaal en heeft geen server nodig. Het inlezen van de
export, het herberekenen van het overzicht en alle berekeningen gebeuren in de
browser. Enkel het ophalen van actuele koersen kan later een tussenstation nodig
hebben, en daarom zit dat achter een interface: een andere implementatie
inpluggen is dan genoeg.

---

## Status

De projectopzet staat. Het transactiemodel en de parser zijn in aanbouw.
