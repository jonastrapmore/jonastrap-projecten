import type { Transaction } from '../models/transaction';

/**
 * Voegt nieuwe transacties bij de bestaande, zonder dubbele.
 *
 * De sleutel is `id`, die de parser samenstelt uit tijdstip, ticker, type en
 * bedrag. Daardoor is het veilig om hetzelfde bestand twee keer in te laden,
 * of exports met overlappende periodes: wat er al in zit, blijft zoals het is.
 *
 * Geeft altijd een nieuwe array terug. In React is dat geen detail: hij
 * vergelijkt of het om hetzelfde object gaat om te bepalen of er hertekend
 * moet worden. Pas je de bestaande lijst ter plaatse aan, dan ziet hij geen
 * verschil en verandert er niets op het scherm.
 */
export function mergeTransactions(
    existing: Transaction[],
    incoming: Transaction[],
): Transaction[] {
    const byId = new Map(existing.map((t) => [t.id, t]));

    for (const t of incoming) {
        // Bestaat hij al, dan laten we hem staan. Zo blijft een eerdere
        // inlezing leidend en kan een herhaalde upload niets stukmaken.
        if (!byId.has(t.id)) {
            byId.set(t.id, t);
        }
    }

    // Sorteren op de ruwe tekst en niet op `timestamp`: die laatste is een Date
    // en kapt af naar milliseconden, waardoor twee transacties in dezelfde
    // milliseconde een willekeurige volgorde zouden krijgen.
    return [...byId.values()].sort((a, b) => a.timestampRaw.localeCompare(b.timestampRaw));
}
