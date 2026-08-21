import type { PriceQuote, ValuePoint } from './models/price';
import type { Transaction } from './models/transaction';

/**
 * Haalt koersen uit de transacties zelf.
 *
 * Elke aankoop noteert de koers waaraan gekocht is, dus je hebt gratis een
 * meetpunt per aankoopdag. Voor een portefeuille waar maandelijks in gestort
 * wordt, levert dat vanzelf een maandelijkse reeks op zonder dat er iets
 * ingetypt hoeft te worden.
 */
export function quotesFromTransactions(transactions: Transaction[]): PriceQuote[] {
    const quotes: PriceQuote[] = [];

    for (const t of transactions) {
        if (t.type === 'DEPOSIT' || t.ticker === null || t.pricePerShareCents === null) {
            continue;
        }
        quotes.push({
            date: t.timestampRaw.slice(0, 10),
            ticker: t.ticker,
            priceCents: t.pricePerShareCents,
        });
    }

    return quotes.sort((a, b) => a.date.localeCompare(b.date) || a.ticker.localeCompare(b.ticker));
}

/**
 * De laatst bekende koers van een fonds op of voor een datum.
 *
 * Kocht je in juni niets, dan blijft de koers van mei gelden tot er een nieuwe
 * bekend is. Dat is de gebruikelijke aanpak bij een reeks met gaten: doorrekenen
 * met de laatste bekende waarde in plaats van gokken wat ertussen gebeurde.
 *
 * Geeft null als er voor die datum nog geen enkele koers bekend is.
 */
export function priceAt(quotes: PriceQuote[], ticker: string, date: string): number | null {
    let laatste: number | null = null;

    // De reeks is gesorteerd op datum, dus we kunnen gewoon doorlopen tot we
    // voorbij de gevraagde dag zijn.
    for (const q of quotes) {
        if (q.date > date) {
            break;
        }
        if (q.ticker === ticker) {
            laatste = q.priceCents;
        }
    }

    return laatste;
}

/**
 * Bouwt de reeks voor de waardegrafiek: per meetdag de cumulatieve inleg en
 * wat de portefeuille op dat moment waard was.
 *
 * De meetdagen zijn de dagen waarop we een koers kennen. Meer punten hebben we
 * niet, en ertussen iets verzinnen zou een gladdere lijn geven die minder waar is.
 */
export function buildValueSeries(
    transactions: Transaction[],
    quotes: PriceQuote[],
): ValuePoint[] {
    const purchases = transactions
        .filter((t) => t.type === 'BUY')
        .sort((a, b) => a.timestampRaw.localeCompare(b.timestampRaw));

    const dates = [...new Set(quotes.map((q) => q.date))].sort();

    // Aantal aandelen per fonds, opgebouwd terwijl we door de datums lopen.
    // Zo hoeven we niet voor elke datum opnieuw alle transacties te doorlopen.
    const sharesE8 = new Map<string, number>();
    let investedCents = 0;
    let next = 0;

    return dates.map((date) => {
        // Alles wat tot en met deze dag gekocht is erbij tellen.
        while (next < purchases.length && purchases[next].timestampRaw.slice(0, 10) <= date) {
            const t = purchases[next];
            if (t.ticker !== null && t.quantityE8 !== null) {
                sharesE8.set(t.ticker, (sharesE8.get(t.ticker) ?? 0) + t.quantityE8);
                investedCents += t.amountCents;
            }
            next++;
        }

        let valueCents = 0;
        for (const [ticker, qE8] of sharesE8) {
            const price = priceAt(quotes, ticker, date);
            if (price !== null) {
                // Delen door 1e8 gebeurt hier omdat aandelen en koers allebei
                // geschaald zijn; het tussenresultaat blijft ruim binnen wat
                // een JavaScript-getal exact aankan.
                valueCents += Math.round((qE8 * price) / 1e8);
            }
        }

        return { date, investedCents, valueCents };
    });
}

/**
 * Voegt afgeleide en zelf ingevoerde koersen samen.
 *
 * Bij dezelfde dag en hetzelfde fonds wint wat je zelf invoerde. Reden: de
 * koers uit een aankoop is die van het moment van uitvoeren, terwijl je zelf
 * meestal de slotkoers opzoekt. Heb je moeite gedaan om er een op te zoeken,
 * dan bedoel je die.
 */
export function mergeQuotes(derived: PriceQuote[], manual: PriceQuote[]): PriceQuote[] {
    const byKey = new Map<string, PriceQuote>();

    for (const q of derived) {
        byKey.set(`${q.date}|${q.ticker}`, q);
    }
    for (const q of manual) {
        byKey.set(`${q.date}|${q.ticker}`, q);
    }

    return [...byKey.values()].sort(
        (a, b) => a.date.localeCompare(b.date) || a.ticker.localeCompare(b.ticker),
    );
}
