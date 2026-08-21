# Beleggingsdashboard

**Auteur:** Jonas Trap
**Opleiding:** Graduaat Programmeren, Thomas More Geel
**Jaar:** 2026-2027

Een persoonlijk dashboard rond een ETF-portefeuille: huidige waarde, rendement,
verdeling over meerdere begunstigden, een overzicht voor de Belgische beurstaks
en een prognose richting twee spaardoelen.

---

## Voortgang

| Datum | Onderdeel | Status | Omschrijving |
| --- | --- | --- | --- |
| 19/08/2026 | Projectopzet | Afgewerkt | Vite + React + TypeScript opgezet, Bootstrap 5 en de huisstijl van jonastrap.be aangesloten, gitignore ingericht op een publieke repo |
| 19/08/2026 | Transactiemodel | Afgewerkt | Brokeronafhankelijk intern formaat. Bedragen als hele centen, aantallen als geheel getal maal 1e8 |
| 19/08/2026 | CSV-parser | Afgewerkt | Broker-export inlezen. Kopregel, kolomaantal, transactietype, tijdstip en munt worden gecontroleerd; wat niet herkend wordt laat de parser falen met het regelnummer erbij |
| 19/08/2026 | Ledger: posities | Afgewerkt | Aantal aandelen en kostprijs per fonds, telkens herberekend uit de transacties. Verkopen gooien bewust een fout tot de kostprijsmethode gekozen is |
| 19/08/2026 | Interface | Afgewerkt | Bestand kiezen, foutmelding, positietabel en transactietabel, elk als eigen component |
| 21/08/2026 | Eigendomsverdeling | Afgewerkt | Inlegregels met ingangsdatum plus uitzonderingen per aankoop. De aandelen worden verdeeld naar rato van de inleg, waarbij de laatste begunstigde de rest krijgt zodat de delen exact optellen tot wat er gekocht is |
| 21/08/2026 | Opslag | Afgewerkt | Transacties bewaard achter een provider-interface, met localStorage als eerste implementatie. Een upload voegt toe in plaats van te vervangen: dubbele worden op hun sleutel herkend, dus dezelfde export twee keer inladen of overlappende periodes gebruiken kan geen kwaad |
| | Inlegoverzicht per begunstigde | Bezig | Chronologisch overzicht van wie wanneer hoeveel in welk fonds legde, met subtotalen, waarde en rendement per persoon. Wordt berekend uit de transacties en de inlegregels, niet met de hand bijgehouden |
| | Inlegkalender | Gepland | Per maand wat er verwacht werd volgens de inlegregels, wat er werkelijk inging, en het verschil. Alarm op het cumulatieve verschil, niet op de losse maand |
| | Actuele koersen | Gepland | Achter een provider-interface. Nodig voor waarde en rendement |
| | Beurstaksoverzicht | Gepland | Aangifte per periode van twee maanden, met deadlineteller |
| | Prognose | Gepland | Projectie met een band in plaats van een enkele lijn |
| | Look-through | Gepland | Gecombineerde topposities over de fondsen heen |

---

## Doelstelling

Een broker levert een overzicht van wat er op je rekening staat, en daar houdt
het op. Vier dingen die ik wilde weten, kon ik nergens aflezen:

1. **Wat is van wie.** De portefeuille wordt door meer dan een persoon gevuld,
   met bedragen die per fonds verschillen en in de loop van de tijd wijzigen.
   Tot nu toe hield ik dat in een tekstbestand bij, naast de export. Twee lijsten
   die hetzelfde zouden moeten zeggen lopen vroeg of laat uiteen, en dat gebeurde
   ook: bij het naast elkaar leggen bleken er vijf verschillen in te zitten.
2. **Wat ben ik aan belastingen verschuldigd.** De broker in kwestie houdt de
   Belgische taks op beursverrichtingen niet in aan de bron. Die moet je zelf
   aangeven, per periode van twee maanden, met een vervaldag die snel passeert.
3. **Hoe elk fonds afzonderlijk presteert.** De broker toont het resultaat van
   de rekening als geheel, niet per fonds. Dat ene gemiddelde verbergt dat het
   ene fonds ver voorloopt terwijl het andere onder water staat.
4. **Waar kom ik uit.** Niet als een enkel getal, maar als een bandbreedte,
   want een geconcentreerde portefeuille kan er ver naast zitten.

Dit project rekent die vier dingen uit op basis van de ruwe transacties. Dat kan,
omdat het transactieoverzicht de bron is en niet wat de broker toevallig toont:
uit dezelfde rijen valt elke opsplitsing te herberekenen.

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

## Een overgeslagen maand

Een maand zonder inleg is rekenkundig geen probleem: wat er niet in de export
staat, wordt nooit meegeteld. Het ledger kan er niet door misgaan. Maar het is
wel informatie die anders verloren gaat, en daarom komt er een kalender die per
maand toont wat er verwacht werd en wat er werkelijk inging.

Die kalender mag **niet per losse maand alarm slaan**. Een aankoop die een dag
over de maandgrens valt, of een maand die vooruit betaald werd, ziet er dan uit
als een gemiste betaling. In de eigen historiek van dit project gebeurde dat
twee keer: twee maanden zonder aankoop, allebei opgevangen door een dubbele
inleg de maand ervoor.

De kolom die het echte antwoord geeft is het **cumulatieve verschil** tussen
verwacht en werkelijk. Staat dat op nul, dan loopt alles gelijk, hoe grillig de
losse maanden er ook uitzien. Pas als het structureel negatief wordt, is er
werkelijk iets blijven liggen.

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

De persoonlijke configuratie zit niet in deze repo. Maak eerst je eigen versie
op basis van het voorbeeld en vul je gegevens in:

```bash
cp src/config/verdeling.example.ts src/config/verdeling.ts
```

Zonder dat bestand start de applicatie niet. Dat is met opzet: liever een
duidelijke fout dan stilzwijgend rekenen met verzonnen bedragen.

Daarna:

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

De keten van CSV naar scherm werkt: een export inlezen, omzetten naar transacties,
die bewaren, daaruit de posities per fonds herberekenen en tonen. De uitkomst is
getoetst aan een onafhankelijk opgesteld belastingoverzicht en klopt tot op de cent.

De eigendomsverdeling rekent correct: per fonds tellen de delen van de
begunstigden exact op tot het aantal aandelen dat werkelijk gekocht is, tot op
de laatste eenheid van een honderdmiljoenste. Die uitkomst staat nog niet op het
scherm, dat is de eerstvolgende stap.

Daarna de inlegkalender, en de actuele koersen die nodig zijn om waarde en
rendement te kunnen berekenen.
