import { parseScaled } from './data/scaledInt';

// Weergavehulpjes. Dit is de enige plek in het project waar door 100
// of door 1e8 gedeeld wordt: overal elders blijven het hele getallen.

/** Toont een bedrag in hele centen als euro's. */
export function formatEuro(cents: number): string {
    return (cents / 100).toLocaleString('nl-BE', { style: 'currency', currency: 'EUR' });
}

/** Toont een geschaald aantal aandelen (x 1e8) als leesbaar getal. */
export function formatQuantity(quantityE8: number | null): string {
    if (quantityE8 === null) {
        return '';
    }
    return (quantityE8 / 1e8).toLocaleString('nl-BE', {
        minimumFractionDigits: 8,
        maximumFractionDigits: 8,
    });
}

/** Toont een tijdstip als Belgische datum. */
export function formatDate(timestamp: Date): string {
    return timestamp.toLocaleDateString('nl-BE');
}

/** Toont een prijs per aandeel, met 4 decimalen. */
export function formatPricePerShare(cents: number): string {
    return (cents / 100).toLocaleString('nl-BE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
    });
}

/**
 * Zet een ingetypt bedrag om naar hele centen.
 *
 * Geeft `null` bij iets wat geen bedrag is, zodat een knop uit kan blijven in
 * plaats van dat er een fout gegooid wordt terwijl iemand nog aan het typen is.
 * Een leeg veld telt als nul.
 *
 * De komma wordt een punt: op een Belgisch toetsenbord typt niemand "300.50".
 */
export function parseEuroInput(text: string): number | null {
    const cleaned = text.trim().replace(',', '.');
    if (cleaned === '') {
        return 0;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
        return null;
    }
    return parseScaled(cleaned, 2);
}
