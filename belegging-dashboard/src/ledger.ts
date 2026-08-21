import { allocate } from './allocation';
import type { BeneficiaryLedger, OwnershipConfig, UnallocatedPurchase } from './models/ownership';
import type { BeneficiaryPosition, Position } from './models/position';
import type { Transaction } from './models/transaction';

/**
 * Herberekent de posities uit de transacties. Er wordt niets bewaard:
 * dit draait telkens opnieuw over de volledige lijst (beslissing 1).
 *
 * Enkel aankopen tellen mee. Elke aankoop wordt in de export voorafgegaan
 * door een storting van hetzelfde bedrag; die slaan we hier over, want beide
 * meetellen zou de inleg verdubbelen.
 */
export function buildPositions(transactions: Transaction[]): Position[] {
    const byTicker = new Map<string, Position>();

    for (const t of transactions) {
        // Stortingen zijn geld dat binnenkomt, geen bezit. Bewust overgeslagen.
        if (t.type === 'DEPOSIT') {
            continue;
        }

        // Nog niet ondersteund, en dat zeggen we hardop. Bij een verkoop moet
        // de kostprijs eraf volgens een methode (gemiddelde of FIFO), en die
        // keuze heeft fiscale gevolgen. Die maak je niet terloops.
        if (t.type === 'SELL') {
            throw new Error(
                `Verkopen worden nog niet ondersteund (${t.id}): ` +
                    `de kostprijsmethode is nog niet gekozen.`,
            );
        }

        // Een aankoop zonder fonds of aantal bestaat niet. Komt het toch voor,
        // dan klopt er iets niet aan de export en willen we dat weten.
        if (t.ticker === null || t.quantityE8 === null) {
            throw new Error(`Aankoop zonder ticker of aantal: ${t.id}`);
        }

        // Haal de lopende positie op, of begin bij nul als dit fonds nieuw is.
        const position = byTicker.get(t.ticker) ?? {
            ticker: t.ticker,
            quantityE8: 0,
            costCents: 0,
            purchaseCount: 0,
        };

        position.quantityE8 += t.quantityE8;
        position.costCents += t.amountCents;
        position.purchaseCount += 1;

        byTicker.set(t.ticker, position);
    }

    // Vaste volgorde, zodat de tabel niet omspringt bij een nieuwe export.
    return [...byTicker.values()].sort((a, b) => a.ticker.localeCompare(b.ticker));
}

/**
 * Zelfde idee als buildPositions, maar dan opgesplitst per begunstigde.
 *
 * Per aankoop wordt gevraagd wie er hoeveel inlegde, en die deelaandelen
 * worden opgeteld per persoon per fonds. Ook dit wordt telkens opnieuw
 * berekend en nooit bewaard: het eigendomspercentage is een uitkomst en
 * geen invoer.
 *
 * Aankopen die op geen enkele regel passen laten deze functie NIET falen.
 * Ze worden verzameld in `unallocated`, zodat het scherm ze allemaal tegelijk
 * kan tonen om alsnog toe te wijzen. Stoppen bij de eerste zou betekenen dat
 * je ze een voor een moet ontdekken.
 */
export function buildBeneficiaryLedger(
    transactions: Transaction[],
    config: OwnershipConfig,
): BeneficiaryLedger {
    const byKey = new Map<string, BeneficiaryPosition>();
    const unallocated: UnallocatedPurchase[] = [];

    for (const t of transactions) {
        // Stortingen zijn geen bezit en horen niet bij een persoon.
        if (t.type === 'DEPOSIT') {
            continue;
        }

        // allocate gooit hier ook op, maar TypeScript weet dat niet: die kent
        // alleen de handtekening, niet wat er binnenin gebeurt. Dus een echte
        // controle in plaats van een uitroepteken.
        const { ticker } = t;
        if (ticker === null) {
            throw new Error(`Aankoop zonder ticker: ${t.id}`);
        }

        let allocations;
        try {
            allocations = allocate(t, config);
        } catch (e) {
            // Geen regel en geen uitzondering voor deze aankoop. Niet stoppen:
            // opzij leggen en verder, zodat de gebruiker ze in een keer ziet.
            unallocated.push({
                transaction: t,
                ticker,
                date: t.timestampRaw.slice(0, 10),
                reason: e instanceof Error ? e.message : String(e),
            });
            continue;
        }

        for (const allocation of allocations) {
            // Samengestelde sleutel: een persoon kan in meer dan een fonds
            // zitten, en een fonds kan van meer dan een persoon zijn.
            const key = `${allocation.beneficiary}|${ticker}`;

            const position = byKey.get(key) ?? {
                beneficiary: allocation.beneficiary,
                ticker,
                quantityE8: 0,
                costCents: 0,
                purchaseCount: 0,
            };

            position.quantityE8 += allocation.quantityE8;
            position.costCents += allocation.costCents;
            position.purchaseCount += 1;

            byKey.set(key, position);
        }
    }

    // Vaste volgorde: eerst op persoon, dan op fonds. Zo springt de tabel niet
    // om bij een nieuwe export.
    const positions = [...byKey.values()].sort(
        (a, b) =>
            a.beneficiary.localeCompare(b.beneficiary) || a.ticker.localeCompare(b.ticker),
    );

    return { positions, unallocated };
}
