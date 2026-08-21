import type { PriceQuote } from '../models/price';
import type { PriceStore } from './priceStore';

const KEY = 'belegging-dashboard:koersen';

export const localStoragePriceStore: PriceStore = {
    async load(): Promise<PriceQuote[]> {
        const raw = localStorage.getItem(KEY);
        if (raw === null) {
            return [];
        }

        try {
            return JSON.parse(raw) as PriceQuote[];
        } catch {
            throw new Error(
                'De opgeslagen koersen zijn onleesbaar. Wis ze en voer ze opnieuw in.',
            );
        }
    },

    async save(quotes: PriceQuote[]): Promise<void> {
        localStorage.setItem(KEY, JSON.stringify(quotes));
    },

    async clear(): Promise<void> {
        localStorage.removeItem(KEY);
    },
};
