// script.js
//
// Regelt het "opzoeken" en "opslaan" van ledengegevens op index.html.
// Er wordt bewust GEEN framework gebruikt: gewone DOM-methodes
// (document.getElementById, fetch, ...) volstaan voor dit formulier.
//
// Belangrijk over paden: alle fetch()-aanroepen hieronder gebruiken
// relatieve paden ("data/members.json", "php/save.php" - zonder "/"
// vooraan). Zo'n relatief pad wordt door de browser opgelost tegenover
// de URL van index.html zelf, ongeacht in welke submap deze site op
// Combell terechtkomt. Dat blijft zo werken zelfs al ligt index.html
// niet in de domeinroot maar bv. in /ledencontrole/index.html.

// Lijst van velden die de gebruiker mag zien/aanpassen. Deze lijst
// wordt op twee plaatsen gebruikt: om het formulier te vullen na het
// opzoeken, en om het formulier terug uit te lezen bij het opslaan.
// Zo staat de veldenlijst maar op één plaats en moet ze bij een
// toekomstige aanpassing (veld toevoegen/verwijderen) maar op één
// plaats aangepast worden.
const EDITABLE_FIELDS = [
  'naam', 'voornaam', 'adres', 'nummer', 'bus', 'postcode',
  'gemeente', 'geboortedatum', 'telefoon', 'gsm', 'mail',
];

// Meteen bij het laden van de pagina: alle leden ophalen en de
// eventlisteners koppelen aan de knoppen/formulieren.
(async function init() {
  const members = await loadMembers();

  const lidnummerInput = document.getElementById('lidnummer');
  const lookupForm = document.getElementById('lookup-form');
  const zoekBtn = document.getElementById('zoek-btn');
  const memberForm = document.getElementById('member-form');

  // De "Zoeken"-knop is bewust een gewone <button type="button">
  // (geen submit-knop) met een eigen click-eventlistener. Daardoor
  // gebeurt het opzoeken enkel bij een expliciete klik (of Enter,
  // via de submit-listener hieronder) en niet meer automatisch
  // terwijl je typt.
  zoekBtn.addEventListener('click', () => handleLookup(members, lidnummerInput.value));

  // Vangnet voor de Enter-toets in het lidnummerveld: het formulier
  // submit't dan, wat we hier opvangen zodat de pagina niet herlaadt
  // en dezelfde opzoekactie als de knop wordt uitgevoerd.
  lookupForm.addEventListener('submit', (event) => {
    event.preventDefault();
    handleLookup(members, lidnummerInput.value);
  });

  // Het "Opslaan"-formulier (stap 2) stuurt de ingevulde gegevens
  // naar de server in plaats van de pagina te herladen.
  memberForm.addEventListener('submit', (event) => {
    event.preventDefault();
    handleSave(members, lidnummerInput.value.trim());
  });
})();

// Haalt de volledige ledenlijst op uit data/members.json.
// Deze lijst blijft in het geheugen (in de browser) staan zolang de
// pagina open is, zodat we niet bij elke druk op "Zoeken" opnieuw
// naar de server moeten voor dezelfde gegevens.
async function loadMembers() {
  const response = await fetch('data/members.json');
  if (!response.ok) {
    throw new Error('members.json kon niet geladen worden');
  }
  return response.json();
}

// Zoekt het ingegeven lidnummer op in de lijst van leden en toont
// ofwel een foutmelding, ofwel het ingevulde gegevensformulier.
function handleLookup(members, rawValue) {
  const lidnummer = rawValue.trim();
  const lookupMessage = document.getElementById('lookup-message');
  const memberFormWrapper = document.getElementById('member-form-wrapper');

  // Leeg veld: alles terug verbergen (bv. na het wissen van het veld).
  if (!lidnummer) {
    lookupMessage.hidden = true;
    memberFormWrapper.hidden = true;
    return;
  }

  // Lidnummers worden als tekst vergeleken (members.json bevat ze ook
  // als tekst), zo speelt een eventueel voorloopnul geen rol.
  const member = members.find((m) => m.lidnummer === lidnummer);

  if (!member) {
    lookupMessage.textContent = `Geen lid gevonden met licentienummer ${lidnummer}.`;
    lookupMessage.dataset.type = 'error';
    lookupMessage.hidden = false;
    memberFormWrapper.hidden = true;
    return;
  }

  lookupMessage.textContent = `Lid gevonden: ${member.voornaam} ${member.naam}.`;
  lookupMessage.dataset.type = 'success';
  lookupMessage.hidden = false;

  fillMemberForm(member);
  memberFormWrapper.hidden = false;
}

// Zet de waarden van het gevonden lid in de invoervelden van stap 2.
function fillMemberForm(member) {
  EDITABLE_FIELDS.forEach((field) => {
    document.getElementById(field).value = member[field] ?? '';
  });
}

// Stuurt de (eventueel aangepaste) gegevens naar php/save.php.
// De server bepaalt of er effectief iets veranderd is (status "OK" of
// "UPDATED") en schrijft dat weg in members.json + log.json - de
// browser zelf kan/mag geen bestanden op de server wegschrijven.
async function handleSave(members, lidnummer) {
  const recordStatus = document.getElementById('record-status');

  const payload = { lidnummer };
  EDITABLE_FIELDS.forEach((field) => {
    payload[field] = document.getElementById(field).value.trim();
  });

  let result;
  try {
    const response = await fetch('php/save.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    result = await response.json();
    if (!response.ok) {
      throw new Error(result.error ?? 'Opslaan mislukt.');
    }
  } catch (error) {
    recordStatus.textContent = error.message;
    recordStatus.dataset.status = 'ERROR';
    return;
  }

  // De server normaliseert elk veld naar een vaste structuur (bv. NAAM
  // in hoofdletters, telefoonnummers zonder spaties) - die genormaliseerde
  // waarden krijgen we terug in result.velden en tonen we meteen in het
  // formulier, zodat je ziet wat er effectief is opgeslagen.
  fillMemberForm(result.velden);

  // De lokale kopie (in het geheugen van de browser) ook bijwerken,
  // zodat de pagina consistent blijft als je in dezelfde sessie
  // nogmaals hetzelfde lidnummer zou opzoeken.
  const member = members.find((m) => m.lidnummer === lidnummer);
  if (member) {
    Object.assign(member, result.velden, { controleStatus: result.status });
  }

  recordStatus.textContent = result.status === 'OK'
    ? 'Bevestigd: je gegevens klopten al.'
    : 'Opgeslagen: je gegevens zijn aangepast.';
  recordStatus.dataset.status = result.status;
}
