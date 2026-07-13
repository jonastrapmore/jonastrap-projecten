// overzicht.js
//
// Regelt de lokale overzichtspagina (overzicht.html): laadt data/members.json
// en data/log.json, en toont per gekozen weergave (volledige lijst / OK /
// updated / nog niets gedaan) een tabel met de bijhorende kleuren. Deze
// pagina is enkel voor eigen gebruik en wordt niet mee online gezet.

// Vaste kolomvolgorde + label, zelfde volgorde als in members.json
// (zie tools/convert-members.js), zodat de tabel er steeds hetzelfde uitziet
// ongeacht welke velden een individueel lid toevallig heeft ingevuld.
const FIELDS = [
  { key: 'lidnummer', label: 'Lidnummer' },
  { key: 'naam', label: 'Naam' },
  { key: 'voornaam', label: 'Voornaam' },
  { key: 'adres', label: 'Straat' },
  { key: 'nummer', label: 'Nummer' },
  { key: 'bus', label: 'Bus' },
  { key: 'postcode', label: 'Postcode' },
  { key: 'gemeente', label: 'Gemeente' },
  { key: 'geboortedatum', label: 'Geboortedatum' },
  { key: 'telefoon', label: 'Telefoon' },
  { key: 'gsm', label: 'GSM' },
  { key: 'mail', label: 'E-mail' },
  { key: 'niveau', label: 'Niveau' },
  { key: 'lidmaatschapsstatus', label: 'Lidmaatschapsstatus' },
  { key: 'lidmaatschap', label: 'Lidmaatschap' },
  { key: 'foto', label: 'Foto' },
  { key: 'transfer', label: 'Transfer' },
  { key: 'gdpr', label: 'GDPR' },
  { key: 'controleStatus', label: 'Controlestatus' },
  { key: 'laatstGecontroleerd', label: 'Laatst gecontroleerd' },
];

(async function init() {
  const [members, log] = await Promise.all([
    loadJson('data/members.json'),
    loadJson('data/log.json'),
  ]);
  const gewijzigdeVeldenPerLid = bouwGewijzigdeVeldenMap(log);

  const filterSelect = document.getElementById('status-filter');
  const downloadBtn = document.getElementById('download-btn');

  const render = () => weergeven(filterSelect.value, members, gewijzigdeVeldenPerLid);

  filterSelect.addEventListener('change', () => {
    downloadBtn.hidden = filterSelect.value !== 'leeg';
    render();
  });

  downloadBtn.addEventListener('click', () => {
    downloadNogTeControleren(filterMembers('leeg', members));
  });

  renderTableHead();
  render();
})();

async function loadJson(pad) {
  const response = await fetch(pad);
  if (!response.ok) {
    throw new Error(`${pad} kon niet geladen worden`);
  }
  return response.json();
}

// Zet de log-geschiedenis om naar een map lidnummer -> Set van veldnamen die
// ooit gewijzigd zijn. Een lid kan meerdere keren opgeslagen hebben; we tonen
// de unie van alle gewijzigde velden over al die opslagacties heen, zodat
// ook een oudere wijziging zichtbaar blijft zolang de status UPDATED is.
function bouwGewijzigdeVeldenMap(log) {
  const map = new Map();
  log.forEach((entry) => {
    if (!Array.isArray(entry.wijzigingen) || entry.wijzigingen.length === 0) {
      return;
    }
    const set = map.get(entry.lidnummer) ?? new Set();
    entry.wijzigingen.forEach((w) => set.add(w.veld));
    map.set(entry.lidnummer, set);
  });
  return map;
}

function filterMembers(filter, members) {
  switch (filter) {
    case 'ok':
      return members.filter((m) => m.controleStatus === 'OK');
    case 'updated':
      return members.filter((m) => m.controleStatus === 'UPDATED');
    case 'leeg':
      return members.filter((m) => !m.controleStatus);
    default:
      return members;
  }
}

function renderTableHead() {
  const thead = document.getElementById('table-head');
  const row = document.createElement('tr');
  FIELDS.forEach((field) => {
    const th = document.createElement('th');
    th.textContent = field.label;
    row.appendChild(th);
  });
  thead.appendChild(row);
}

function weergeven(filter, members, gewijzigdeVeldenPerLid) {
  const rows = filterMembers(filter, members);
  const tbody = document.getElementById('table-body');
  const emptyMessage = document.getElementById('overzicht-empty');
  const count = document.getElementById('overzicht-count');

  tbody.innerHTML = '';
  count.textContent = `${rows.length} van ${members.length} leden`;
  emptyMessage.hidden = rows.length > 0;

  rows.forEach((member) => {
    const tr = document.createElement('tr');

    // Volledige rij groen (OK/updated) of rood (nog niets gedaan), ongeacht
    // welke weergave actief is - zo blijft de status ook zichtbaar in de
    // "Volledige lijst".
    tr.classList.add(member.controleStatus ? 'row-ok' : 'row-none');

    // Enkel bij een lid met status UPDATED tonen we welke velden effectief
    // gewijzigd zijn (afgeleid uit data/log.json). Zou de status nadien
    // teruggezet zijn naar OK, dan verdwijnt deze markering ook weer.
    const gewijzigdeVelden = member.controleStatus === 'UPDATED'
      ? (gewijzigdeVeldenPerLid.get(member.lidnummer) ?? new Set())
      : new Set();

    FIELDS.forEach((field) => {
      const td = document.createElement('td');
      td.textContent = field.key === 'laatstGecontroleerd'
        ? formatteerDatum(member[field.key])
        : (member[field.key] ?? '');

      if (gewijzigdeVelden.has(field.key)) {
        td.classList.add('field-changed');
      }

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}

function formatteerDatum(iso) {
  if (!iso) {
    return '';
  }
  const datum = new Date(iso);
  if (Number.isNaN(datum.getTime())) {
    return iso;
  }
  return datum.toLocaleString('nl-BE');
}

// Downloadt lidnummer, voornaam en naam van de leden die nog niets gedaan
// hebben, als CSV (puntkomma als scheidingsteken en een BOM vooraan, zodat
// Excel in een Belgische/Nederlandse taalinstelling het meteen correct opent).
function downloadNogTeControleren(members) {
  const header = 'Lidnummer;Voornaam;Naam';
  const rijen = members.map((m) => [m.lidnummer, m.voornaam, m.naam].map(escapeCsv).join(';'));
  const BOM = '﻿';
  const csv = BOM + [header, ...rijen].join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `nog-te-controleren-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(waarde) {
  const tekst = String(waarde ?? '');
  return /[;"\r\n]/.test(tekst) ? `"${tekst.replace(/"/g, '""')}"` : tekst;
}
