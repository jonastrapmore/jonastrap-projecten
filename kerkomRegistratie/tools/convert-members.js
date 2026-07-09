// convert-members.js
//
// Zet het originele ledenrapport (bron/ledenrapport.xls) om naar
// data/members.json, het bestand dat de website effectief gebruikt.
//
// Waarom dit nodig is: ledenrapport.xls is geen "echt" Excel-bestand,
// maar een HTML-tabel die toevallig de extensie .xls heeft gekregen
// (waarschijnlijk een export uit een ledenbeheersysteem). Deze
// omzetting parsen we dus als HTML, niet als een Excel-bestand.
//
// Wanneer opnieuw gebruiken: als de club een nieuw ledenrapport
// exporteert, zet het nieuwe bestand in bron/ledenrapport.xls en
// draai dit script opnieuw:
//
//   node tools/convert-members.js
//
// Let op: dit OVERSCHRIJFT data/members.json volledig, inclusief de
// controleStatus/laatstGecontroleerd-velden die leden zelf via de
// website hebben ingevuld. Gebruik dit dus enkel bij een volledig
// nieuwe ledenlijst, niet voor dagelijks gebruik.

const fs = require('fs');
const path = require('path');

const BRON_PAD = path.join(__dirname, '..', 'bron', 'ledenrapport.xls');
const DOEL_PAD = path.join(__dirname, '..', 'data', 'members.json');

// ledenrapport.xls is ISO-8859-1 gecodeerd (herkenbaar aan tekens als
// "DEMOITI�" i.p.v. "DEMOITIé" wanneer je het als UTF-8 zou lezen).
// We lezen het dus expliciet als "latin1" in plaats van de standaard
// "utf8", anders lopen namen met accenten (é, ë, ï, ...) fout.
const html = fs.readFileSync(BRON_PAD, 'latin1');

// De tabel bestaat uit <tr>...</tr> rijen met <td>...</td> cellen.
// Geen echte HTML-parser nodig voor dit eenvoudige, voorspelbare formaat.
const rowRegex = /<tr>(.*?)<\/tr>/gs;
const cellRegex = /<td[^>]*>(.*?)<\/td>/gs;

const rows = [...html.matchAll(rowRegex)].map((rowMatch) =>
  [...rowMatch[1].matchAll(cellRegex)].map((cellMatch) => cellMatch[1].trim())
);

// Eerste rij = kolomnamen (bv. "Lidnummer", "Naam", ...). De allereerste
// kolom is telkens leeg (een rij-nummer zonder titel), die slaan we over.
const headerRow = rows[0];
const headers = headerRow.slice(1);
const dataRows = rows.slice(1);

// Vertaling van de kolomnamen uit het xls-bestand naar de veldnamen
// die de website gebruikt (kleine letters, geschikt als HTML id/name).
const KOLOM_NAAR_VELD = {
  Lidnummer: 'lidnummer',
  Naam: 'naam',
  Voornaam: 'voornaam',
  Adres: 'adres',
  Nummer: 'nummer',
  Bus: 'bus',
  Postcode: 'postcode',
  Gemeente: 'gemeente',
  Geboortedatum: 'geboortedatum',
  Telefoon: 'telefoon',
  GSM: 'gsm',
  Mail1: 'mail',
  Niveau: 'niveau',
  Lidmaatschapsstatus: 'lidmaatschapsstatus',
  Lidmaatschap: 'lidmaatschap',
  Foto: 'foto',
  Transfer: 'transfer',
  GDPR: 'gdpr',
};

const members = dataRows.map((cells) => {
  const waarden = cells.slice(1); // eerste kolom (rij-nummer) overslaan
  const lid = {};

  headers.forEach((kolom, i) => {
    const veld = KOLOM_NAAR_VELD[kolom] || kolom.toLowerCase();
    lid[veld] = waarden[i] ?? '';
  });

  // Extra velden voor de controle-flow op de website: bijgehouden
  // door save.php, hier enkel als lege/nulwaarde geïnitialiseerd.
  lid.controleStatus = '';
  lid.laatstGecontroleerd = null;

  return lid;
});

fs.writeFileSync(DOEL_PAD, JSON.stringify(members, null, 2) + '\n', 'utf8');

console.log(`${members.length} leden omgezet naar ${DOEL_PAD}`);
