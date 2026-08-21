import type { Transaction } from '../models/transaction';

/**
 * Opslag voor transacties, achter een interface.
 *
 * De methodes zijn async terwijl localStorage synchroon werkt. Dat is met
 * opzet: gaat dit dashboard ooit naar een server of naar IndexedDB, dan is
 * dat een tweede implementatie en hoeft er aan de aanroepende kant niets te
 * veranderen. Zie ook het hoofdstuk over hosting in de README.
 */
export interface TransactionStore {
    /** Alles wat er bewaard is. Lege lijst als er nog niets staat. */
    load(): Promise<Transaction[]>;

    /** Vervangt de volledige inhoud door deze lijst. */
    save(transactions: Transaction[]): Promise<void>;

    /** Gooit alles weg. Voor "opnieuw opbouwen uit bestand". */
    clear(): Promise<void>;
}
