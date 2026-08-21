import type { Transaction } from '../models/transaction';
import type { TransactionStore } from './transactionStore';

const KEY = 'belegging-dashboard:transacties';

/**
 * Wat er werkelijk wordt weggeschreven: alles behalve `timestamp`.
 *
 * JSON kent geen datums. Een `Date` wordt bij het opslaan een tekst, en bij
 * het inlezen krijg je die tekst terug in plaats van een `Date`. Zou je hem
 * bewaren, dan crasht `timestamp.toLocaleDateString()` bij de eerste
 * herstart, met een foutmelding die nergens naar datums verwijst.
 *
 * We slaan hem dus niet op maar bouwen hem opnieuw uit `timestampRaw`. Dat is
 * ook zuiverder: `timestamp` is een afgeleide waarde, en die bewaren we niet
 * (beslissing 1 uit de README).
 */
type StoredTransaction = Omit<Transaction, 'timestamp'>;

export const localStorageTransactionStore: TransactionStore = {
    async load(): Promise<Transaction[]> {
        const raw = localStorage.getItem(KEY);
        if (raw === null) {
            return [];
        }

        let stored: StoredTransaction[];
        try {
            stored = JSON.parse(raw) as StoredTransaction[];
        } catch {
            // Liever hard falen dan stilzwijgend met een lege portefeuille
            // starten. De knop "opnieuw opbouwen" is de weg terug.
            throw new Error(
                'De opgeslagen transacties zijn onleesbaar. Bouw de gegevens opnieuw op uit je export.',
            );
        }

        return stored.map((t) => ({ ...t, timestamp: new Date(t.timestampRaw) }));
    },

    async save(transactions: Transaction[]): Promise<void> {
        const stored: StoredTransaction[] = transactions.map(({ timestamp, ...rest }) => rest);
        localStorage.setItem(KEY, JSON.stringify(stored));
    },

    async clear(): Promise<void> {
        localStorage.removeItem(KEY);
    },
};
