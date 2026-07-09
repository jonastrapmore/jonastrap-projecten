<?php
// save.php
//
// Ontvangt de ingevulde gegevens uit js/script.js (fetch naar
// "php/save.php"), vergelijkt ze met wat er al in data/members.json
// stond, schrijft de nieuwe waarden weg en logt de wijziging in
// data/log.json. Dit bestand draait op de server (Combell) via PHP -
// de browser kan zelf geen bestanden op de server aanpassen, vandaar
// deze tussenstap.
//
// Paden: __DIR__ is de map waarin DIT bestand staat, dus php/.
// Omdat data/ een buurmap is van php/ (niet een submap ervan),
// moeten we met "/../data/..." een niveau omhoog en dan terug naar
// beneden. Dit zijn bestandssysteempaden (voor fopen/file_get_contents),
// GEEN URL's - ze werken dus even goed op je lokale PHP-testserver
// als op Combell, ongeacht in welke submap de site daar terechtkomt.
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$membersFile = __DIR__ . '/../data/members.json';
$logFile = __DIR__ . '/../data/log.json';

// Enkel deze velden mogen leden zelf aanpassen. Niveau, lidmaatschap,
// status enz. staan hier bewust niet in - die blijven onaangeroerd,
// ook al zouden ze toevallig meegestuurd worden in de aanvraag.
$editableFields = [
    'naam', 'voornaam', 'adres', 'nummer', 'bus', 'postcode',
    'gemeente', 'geboortedatum', 'telefoon', 'gsm', 'mail',
];

// De browser stuurt de gegevens als JSON in de request-body (geen
// klassieke formulier-post), dus lezen we die rechtstreeks uit
// php://input in plaats van uit $_POST.
$input = json_decode((string) file_get_contents('php://input'), true);

if (!is_array($input) || empty($input['lidnummer'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Ongeldige aanvraag.']);
    exit;
}

$lidnummer = trim((string) $input['lidnummer']);

// Zet elk woord van een tekst om naar "Titel case": eerste letter een
// hoofdletter, de rest van dat woord in kleine letters. Gebruikt voor
// velden met eigennamen die uit meerdere woorden kunnen bestaan
// (voornaam, adres) - zo verdwijnt ook een per ongeluk getypte interne
// hoofdletter (bv. "GroenStraat" -> "Groenstraat").
function titelCaseWoorden(string $waarde): string
{
    return implode(' ', array_map(
        fn (string $woord): string => $woord === ''
            ? $woord
            : mb_strtoupper(mb_substr($woord, 0, 1, 'UTF-8'), 'UTF-8')
                . mb_strtolower(mb_substr($woord, 1, null, 'UTF-8'), 'UTF-8'),
        explode(' ', $waarde)
    ));
}

// Brengt een veldwaarde naar een vaste, consistente structuur, ongeacht
// hoe iemand ze intypt. Dit gebeurt VOOR de vergelijking oud/nieuw
// hieronder, zodat bv. een nummer met andere spaties niet als een
// "echte" wijziging telt, maar de opgeslagen waarde wel meteen netjes
// wordt. Zo blijft members.json overheen alle leden dezelfde structuur
// behouden, ook al kwam de brondata (het originele ledenrapport) of de
// invoer van een lid rommelig binnen.
function normaliseerVeld(string $veld, string $waarde): string
{
    // Overal eerst dubbele spaties/tabs herleiden tot één spatie en spaties
    // aan begin/eind wegknippen.
    $waarde = trim(preg_replace('/\s+/', ' ', $waarde));

    switch ($veld) {
        case 'naam':
        case 'gemeente':
            // Achternaam en gemeente altijd in hoofdletters, net als in
            // de rest van het ledenrapport (bv. "BERTELS", "BOUTERSEM").
            return mb_strtoupper($waarde, 'UTF-8');

        case 'nummer':
        case 'bus':
            // Huisnummer/bus: geen spaties, letter-suffix in hoofdletters
            // (bv. "88 a" en "88A" worden allebei "88A").
            return mb_strtoupper(str_replace(' ', '', $waarde), 'UTF-8');

        case 'telefoon':
        case 'gsm':
            // Enkel cijfers behouden (spaties/punten/streepjes weg), met
            // uitzondering van een eventuele "+" voor een internationaal
            // nummer, die blijft enkel staan als hij helemaal vooraan stond.
            $plus = (str_starts_with($waarde, '+')) ? '+' : '';
            return $plus . preg_replace('/\D+/', '', $waarde);

        case 'postcode':
            // Geen spaties in een postcode, ook niet in het midden.
            return str_replace(' ', '', $waarde);

        case 'mail':
            // E-mailadressen altijd in kleine letters.
            return mb_strtolower($waarde, 'UTF-8');

        case 'voornaam':
        case 'adres':
            // Elk woord met een hoofdletter laten beginnen en de rest van
            // dat woord in kleine letters, bv. "eddy jean" -> "Eddy Jean"
            // en "GroenStraat" -> "Groenstraat" (een interne hoofdletter
            // wordt dus niet zomaar overgenomen).
            return titelCaseWoorden($waarde);

        case 'geboortedatum':
            // Welke scheidingstekens ook gebruikt worden (/, ., spatie, ...),
            // altijd opslaan als DD-MM-JJJJ met voorloopnullen, bv.
            // "18/2/1987" -> "18-02-1987" en "9-3-1954" -> "09-03-1954".
            $delen = preg_split('/[^0-9]+/', $waarde, -1, PREG_SPLIT_NO_EMPTY);
            if (count($delen) !== 3) {
                return $waarde;
            }
            [$dag, $maand, $jaar] = $delen;
            return sprintf('%02d-%02d-%s', (int) $dag, (int) $maand, $jaar);

        default:
            return $waarde;
    }
}

// members.json openen in "lezen + schrijven"-modus en meteen
// vergrendelen (flock). Zonder deze vergrendeling zouden twee leden
// die toevallig tegelijk opslaan elkaars wijziging kunnen overschrijven.
// Met flock() wacht de tweede aanvraag gewoon tot de eerste klaar is.
$fp = fopen($membersFile, 'r+');
if (!$fp || !flock($fp, LOCK_EX)) {
    http_response_code(500);
    echo json_encode(['error' => 'Kon members.json niet vergrendelen.']);
    exit;
}

$members = json_decode((string) stream_get_contents($fp), true) ?? [];

// Lid opzoeken op lidnummer (als tekst vergeleken, net als in script.js).
$index = null;
foreach ($members as $i => $member) {
    if ((string) $member['lidnummer'] === $lidnummer) {
        $index = $i;
        break;
    }
}

if ($index === null) {
    flock($fp, LOCK_UN);
    fclose($fp);
    http_response_code(404);
    echo json_encode(['error' => "Geen lid gevonden met licentienummer $lidnummer."]);
    exit;
}

$member = $members[$index];
$wijzigingen = [];

// Elk toegelaten veld vergelijken: oude waarde (uit members.json) versus
// nieuwe waarde (uit de aanvraag) - allebei genormaliseerd, zodat een
// zuiver opmaakverschil (andere spaties, kleine letters, ...) niet als
// een "echte" wijziging telt. De genormaliseerde vorm wordt hoe dan ook
// opgeslagen, ook als er geen echte wijziging was - zo krijgt rommelige
// data uit het oorspronkelijke ledenrapport vanzelf een nette structuur
// zodra een lid zijn gegevens ook maar één keer bevestigt.
foreach ($editableFields as $field) {
    $oud = normaliseerVeld($field, (string) ($member[$field] ?? ''));
    $nieuw = normaliseerVeld($field, (string) ($input[$field] ?? ''));
    if ($oud !== $nieuw) {
        $wijzigingen[] = ['veld' => $field, 'oud' => $oud, 'nieuw' => $nieuw];
    }
    $member[$field] = $nieuw;
}

// Geen wijzigingen deze keer => in principe OK. MAAR: als het record al
// UPDATED stond van een vorige keer, mag dat niet stilletjes terug OK
// worden zodra het lid nadien nog eens (ongewijzigd) opslaat - anders is
// die wijziging alweer "goedgekeurd" voor er een beheerder ze in het
// ledenrapport heeft kunnen controleren. UPDATED blijft dus UPDATED tot
// een beheerder dat zelf terugzet, ongeacht wat leden nadien opslaan.
$wasAlUpdated = ($member['controleStatus'] ?? '') === 'UPDATED';
$status = (!empty($wijzigingen) || $wasAlUpdated) ? 'UPDATED' : 'OK';
$member['controleStatus'] = $status;
$member['laatstGecontroleerd'] = date('c');

$members[$index] = $member;

// members.json volledig herschrijven met de bijgewerkte lijst.
// ftruncate(0) + rewind() is nodig omdat we hetzelfde bestand
// hergebruiken (fopen 'r+' overschrijft geen oude inhoud die na de
// nieuwe, kortere inhoud zou blijven staan als we dat niet doen).
ftruncate($fp, 0);
rewind($fp);
fwrite($fp, json_encode($members, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
fflush($fp);
flock($fp, LOCK_UN);
fclose($fp);

// Elke opslag-actie ook loggen in log.json: een append-only
// geschiedenis van wie wat wanneer aanpaste. Dit bestand wordt nooit
// overschreven, enkel aangevuld - zo blijft er een audit-trail.
$logFp = fopen($logFile, 'c+');
flock($logFp, LOCK_EX);
$log = json_decode((string) stream_get_contents($logFp), true) ?? [];
$log[] = [
    'tijdstip' => date('c'),
    'lidnummer' => $lidnummer,
    'status' => $status,
    'wijzigingen' => $wijzigingen,
];
ftruncate($logFp, 0);
rewind($logFp);
fwrite($logFp, json_encode($log, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
fflush($logFp);
flock($logFp, LOCK_UN);
fclose($logFp);

// Antwoord naar de browser: de status, het detail van wat er veranderd
// is, én de genormaliseerde velden zelf - zo kan script.js het
// formulier meteen bijwerken naar de nette, opgeslagen structuur
// (bv. NAAM in hoofdletters) zonder dat de pagina moet herladen.
$genormaliseerdeVelden = array_intersect_key($member, array_flip($editableFields));
echo json_encode([
    'status' => $status,
    'wijzigingen' => $wijzigingen,
    'velden' => $genormaliseerdeVelden,
]);
