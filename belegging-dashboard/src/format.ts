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
