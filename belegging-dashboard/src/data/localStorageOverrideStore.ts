import type { ContributionOverride } from '../models/ownership';
import type { OverrideStore } from './overrideStore';

const KEY = 'belegging-dashboard:uitzonderingen';

/**
 * Uitzonderingen in localStorage. Eenvoudiger dan de transactieopslag: er
 * zitten alleen tekst en getallen in, geen datums, dus JSON kan ze zonder
 * verlies heen en weer zetten.
 */
export const localStorageOverrideStore: OverrideStore = {
    async load(): Promise<ContributionOverride[]> {
        const raw = localStorage.getItem(KEY);
        if (raw === null) {
            return [];
        }

        try {
            return JSON.parse(raw) as ContributionOverride[];
        } catch {
            // Liever hard falen dan stilzwijgend zonder uitzonderingen rekenen:
            // dan zouden aankopen ineens weer als onverdeeld verschijnen en zou
            // je ze opnieuw invullen zonder te weten waarom.
            throw new Error(
                'De opgeslagen uitzonderingen zijn onleesbaar. Wis ze en vul ze opnieuw in.',
            );
        }
    },

    async save(overrides: ContributionOverride[]): Promise<void> {
        localStorage.setItem(KEY, JSON.stringify(overrides));
    },

    async clear(): Promise<void> {
        localStorage.removeItem(KEY);
    },
};
