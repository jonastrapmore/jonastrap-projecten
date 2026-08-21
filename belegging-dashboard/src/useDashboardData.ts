import { useEffect, useState } from 'react';
import { localStorageOverrideStore } from './data/localStorageOverrideStore';
import { localStoragePriceStore } from './data/localStoragePriceStore';
import { localStorageTransactionStore } from './data/localStorageTransactionStore';
import { mergeTransactions } from './data/mergeTransactions';
import { parseRevolutCsv } from './data/revolutParser';
import type { ContributionOverride } from './models/ownership';
import type { PriceQuote } from './models/price';
import type { Transaction } from './models/transaction';

// Buiten de hook. Deze opslag hoort niet bij de levensduur van een component:
// er is er een, hij bestaat al voor de eerste weergave en blijft na de laatste.
const transactionStore = localStorageTransactionStore;
const overrideStore = localStorageOverrideStore;
const priceStore = localStoragePriceStore;

/**
 * Beheert alles wat bewaard wordt: de transacties, de zelf ingevulde
 * verdelingen en de zelf opgezochte koersen.
 *
 * Dit is een eigen hook. Alles wat React-state of opslag aanraakt zit hier,
 * zodat App alleen nog hoeft te bepalen hoe het scherm eruitziet. De
 * berekeningen zitten weer ergens anders (deriveDashboard), want die hebben
 * geen state nodig en zijn zonder browser te controleren.
 */
export function useDashboardData() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [overrides, setOverrides] = useState<ContributionOverride[]>([]);
    const [manualQuotes, setManualQuotes] = useState<PriceQuote[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    // Blijft true tot de opslag uitgelezen is. Zonder deze vlag flitst er bij
    // het openen heel even "nog geen transacties" voorbij.
    const [loading, setLoading] = useState(true);

    // Draait een keer, na de eerste weergave: dat is wat die lege [] betekent.
    useEffect(() => {
        // Promise.all wacht op alle drie tegelijk in plaats van na elkaar, en
        // geeft de uitkomsten terug in dezelfde volgorde als je ze meegaf.
        Promise.all([transactionStore.load(), overrideStore.load(), priceStore.load()])
            .then(([storedTransactions, storedOverrides, storedQuotes]) => {
                setTransactions(storedTransactions);
                setOverrides(storedOverrides);
                setManualQuotes(storedQuotes);
            })
            .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
            .finally(() => setLoading(false));
    }, []);

    function report(message: string) {
        setError(null);
        setNotice(message);
    }

    async function importCsv(text: string) {
        try {
            const incoming = parseRevolutCsv(text);

            // Samenvoegen in plaats van vervangen. Wat er al in zit blijft staan,
            // dus dezelfde export twee keer inladen of overlappende periodes
            // gebruiken kan geen kwaad.
            const merged = mergeTransactions(transactions, incoming);
            const nieuwe = merged.length - transactions.length;

            // Eerst opslaan, dan pas in de state. Mislukt het opslaan, dan toont
            // het scherm niet iets wat nergens bewaard is.
            await transactionStore.save(merged);
            setTransactions(merged);

            report(
                nieuwe === 0
                    ? `Geen nieuwe transacties: alle ${incoming.length} regels stonden er al in.`
                    : `${nieuwe} nieuwe ${nieuwe === 1 ? 'transactie' : 'transacties'} toegevoegd.`,
            );
        } catch (e) {
            // De parser faalt hard bij iets onbekends. Dan tonen we de melding en
            // laten we de opslag ongemoeid: liever niets dan half.
            setError(e instanceof Error ? e.message : String(e));
            setNotice(null);
        }
    }

    async function clearTransactions() {
        const zeker = window.confirm(
            'Alle opgeslagen transacties wissen? Je kunt ze opnieuw inladen uit je export.',
        );
        if (!zeker) {
            return;
        }
        await transactionStore.clear();
        setTransactions([]);
        report('Transacties gewist.');
    }

    async function saveOverride(override: ContributionOverride) {
        // Een eerdere invoer voor dezelfde aankoop vervangen in plaats van er een
        // tweede naast te zetten: allocate pakt de eerste die past.
        const next = [
            ...overrides.filter((o) => !(o.date === override.date && o.ticker === override.ticker)),
            override,
        ];
        await overrideStore.save(next);
        setOverrides(next);
        report(`Verdeling bewaard voor ${override.ticker} van ${override.date}.`);
    }

    async function deleteOverride(override: ContributionOverride) {
        const next = overrides.filter(
            (o) => !(o.date === override.date && o.ticker === override.ticker),
        );
        await overrideStore.save(next);
        setOverrides(next);
        report(
            `Verdeling van ${override.ticker} op ${override.date} verwijderd. Die aankoop staat weer op de lijst.`,
        );
    }

    async function clearOverrides() {
        const zeker = window.confirm(
            `${overrides.length} ingevulde ${overrides.length === 1 ? 'verdeling' : 'verdelingen'} wissen? De aankopen komen dan opnieuw op de lijst om te verdelen.`,
        );
        if (!zeker) {
            return;
        }
        await overrideStore.clear();
        setOverrides([]);
        report('Ingevulde verdelingen gewist.');
    }

    async function saveQuotes(nieuwe: PriceQuote[]) {
        const behouden = manualQuotes.filter(
            (q) => !nieuwe.some((n) => n.date === q.date && n.ticker === q.ticker),
        );
        const next = [...behouden, ...nieuwe];
        await priceStore.save(next);
        setManualQuotes(next);
        report(
            `${nieuwe.length} ${nieuwe.length === 1 ? 'koers' : 'koersen'} bewaard voor ${nieuwe[0].date}.`,
        );
    }

    async function deleteQuote(quote: PriceQuote) {
        const next = manualQuotes.filter(
            (q) => !(q.date === quote.date && q.ticker === quote.ticker),
        );
        await priceStore.save(next);
        setManualQuotes(next);
        report(`Koers van ${quote.ticker} op ${quote.date} verwijderd.`);
    }

    async function clearQuotes() {
        const zeker = window.confirm(
            `${manualQuotes.length} zelf ingevoerde ${manualQuotes.length === 1 ? 'koers' : 'koersen'} wissen? De koersen uit je aankopen blijven staan.`,
        );
        if (!zeker) {
            return;
        }
        await priceStore.clear();
        setManualQuotes([]);
        report('Ingevoerde koersen gewist.');
    }

    return {
        transactions,
        overrides,
        manualQuotes,
        loading,
        error,
        notice,
        importCsv,
        clearTransactions,
        saveOverride,
        deleteOverride,
        clearOverrides,
        saveQuotes,
        deleteQuote,
        clearQuotes,
    };
}
