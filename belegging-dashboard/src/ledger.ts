import type { Position } from './models/position';
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
