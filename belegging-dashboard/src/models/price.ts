/**
 * Een koers van een fonds op een bepaalde dag.
 *
 * Bewust met een datum erbij en niet als losse "huidige koers". Sla je alleen
 * vandaag op, dan kun je nooit meer dan vandaag tonen. Met een reeks bouw je
 * vanzelf een historiek op, en die heb je nodig voor elke grafiek.
 */
export type PriceQuote = {
    /** ISO-datum, YYYY-MM-DD. */
    date: string;
    ticker: string;
    /** Koers per aandeel in hele centen. */
    priceCents: number;
};

/** Een meetpunt in de waardegrafiek. */
export type ValuePoint = {
    date: string;
    /** Alles wat er tot en met deze dag is ingelegd, cumulatief. */
    investedCents: number;
    /** Wat de portefeuille op deze dag waard was. */
    valueCents: number;
};
