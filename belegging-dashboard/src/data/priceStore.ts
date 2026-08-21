import type { PriceQuote } from '../models/price';

/**
 * Opslag voor koersen die je zelf invoert.
 *
 * De koersen uit je transacties komen gratis mee en worden niet bewaard: die
 * leiden we telkens opnieuw af uit de aankopen. Hier staat alleen wat je zelf
 * hebt opgezocht, voor de dagen waarop je niets kocht.
 */
export interface PriceStore {
    load(): Promise<PriceQuote[]>;
    save(quotes: PriceQuote[]): Promise<void>;
    clear(): Promise<void>;
}
