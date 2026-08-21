import { useEffect, useState } from 'react';
import { ContributionSummary } from './components/ContributionSummary';
import { CsvUpload } from './components/CsvUpload';
import { ManualOverrides } from './components/ManualOverrides';
import { PageHeader } from './components/PageHeader';
import { PositionTable } from './components/PositionTable';
import { PriceInput } from './components/PriceInput';
import { TransactionTable } from './components/TransactionTable';
import { UnallocatedPurchases } from './components/UnallocatedPurchases';
import { ValueChart } from './components/ValueChart';
import { localStorageOverrideStore } from './data/localStorageOverrideStore';
import { localStoragePriceStore } from './data/localStoragePriceStore';
import { localStorageTransactionStore } from './data/localStorageTransactionStore';
import { mergeTransactions } from './data/mergeTransactions';
import { parseRevolutCsv } from './data/revolutParser';
import { ownershipConfig } from './config/verdeling';
import { formatDate } from './format';
import { buildBeneficiaryLedger, buildPositions } from './ledger';
import type { ContributionOverride, UnallocatedPurchase } from './models/ownership';
import type { PriceQuote } from './models/price';
import type { BeneficiaryPosition } from './models/position';
import type { Transaction } from './models/transaction';
import { buildValueSeries, mergeQuotes, quotesFromTransactions } from './valuation';

// Buiten de component. Deze opslag hoort niet bij de levensduur van App:
// er is er een, hij bestaat al voor de eerste weergave, en hij blijft na de
// laatste. Zo is ook meteen duidelijk dat hij niet in de useEffect-lijst
// hieronder hoeft te staan.
const store = localStorageTransactionStore;
const overrideStore = localStorageOverrideStore;
const priceStore = localStoragePriceStore;

/**
 * Houdt de transacties bij en zet de onderdelen samen. De state staat hier
 * omdat meer dan een component hem nodig heeft.
 */
function App() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    // Uitzonderingen die je in het scherm hebt ingevuld. Komen bovenop wat er
    // in het configbestand staat.
    const [overrides, setOverrides] = useState<ContributionOverride[]>([]);
    // Koersen die je zelf hebt opgezocht, voor dagen waarop je niets kocht.
    const [manualQuotes, setManualQuotes] = useState<PriceQuote[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    // Blijft true tot de opslag uitgelezen is. Zonder deze vlag flitst er bij
    // het openen heel even "nog geen transacties" voorbij.
    const [loading, setLoading] = useState(true);

    // Draait een keer, na de eerste weergave. Dat is wat die lege [] betekent.
    // Zonder die haken zou hij bij elke hertekening opnieuw draaien, en omdat
    // hij zelf de state aanpast zou dat een oneindige lus worden.
    useEffect(() => {
        // Promise.all wacht op allebei tegelijk in plaats van na elkaar, en
        // geeft de uitkomsten terug in dezelfde volgorde als je ze meegaf.
        Promise.all([store.load(), overrideStore.load(), priceStore.load()])
            .then(([storedTransactions, storedOverrides, storedQuotes]) => {
                setTransactions(storedTransactions);
                setOverrides(storedOverrides);
                setManualQuotes(storedQuotes);
            })
            .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
            .finally(() => setLoading(false));
    }, []);

    async function handleAssign(override: ContributionOverride) {
        // Een eerdere invoer voor dezelfde aankoop vervangen in plaats van er
        // een tweede naast te zetten. Anders zou allocate de oude blijven
        // vinden, want die pakt de eerste die past.
        const next = [
            ...overrides.filter(
                (o) => !(o.date === override.date && o.ticker === override.ticker),
            ),
            override,
        ];
        await overrideStore.save(next);
        setOverrides(next);
        setError(null);
        setNotice(`Verdeling bewaard voor ${override.ticker} van ${override.date}.`);
    }

    async function handleSaveQuotes(nieuwe: PriceQuote[]) {
        // Voor dezelfde dag en hetzelfde fonds vervangen we de oude invoer,
        // zelfde aanpak als bij de uitzonderingen.
        const behouden = manualQuotes.filter(
            (q) => !nieuwe.some((n) => n.date === q.date && n.ticker === q.ticker),
        );
        const next = [...behouden, ...nieuwe];
        await priceStore.save(next);
        setManualQuotes(next);
        setError(null);
        setNotice(
            `${nieuwe.length} ${nieuwe.length === 1 ? 'koers' : 'koersen'} bewaard voor ${nieuwe[0].date}.`,
        );
    }

    async function handleDeleteQuote(quote: PriceQuote) {
        const next = manualQuotes.filter(
            (q) => !(q.date === quote.date && q.ticker === quote.ticker),
        );
        await priceStore.save(next);
        setManualQuotes(next);
        setError(null);
        setNotice(`Koers van ${quote.ticker} op ${quote.date} verwijderd.`);
    }

    async function handleDeleteOverride(override: ContributionOverride) {
        const next = overrides.filter(
            (o) => !(o.date === override.date && o.ticker === override.ticker),
        );
        await overrideStore.save(next);
        setOverrides(next);
        setError(null);
        setNotice(
            `Verdeling van ${override.ticker} op ${override.date} verwijderd. Die aankoop staat weer op de lijst.`,
        );
    }

    async function handleClearQuotes() {
        const zeker = window.confirm(
            `${manualQuotes.length} zelf ingevoerde ${manualQuotes.length === 1 ? 'koers' : 'koersen'} wissen? De koersen uit je aankopen blijven staan.`,
        );
        if (!zeker) {
            return;
        }
        await priceStore.clear();
        setManualQuotes([]);
        setError(null);
        setNotice('Ingevoerde koersen gewist.');
    }

    async function handleFileRead(text: string) {
        try {
            const incoming = parseRevolutCsv(text);

            // Samenvoegen in plaats van vervangen. Wat er al in zit blijft
            // staan, dus je mag hetzelfde bestand gerust twee keer inladen of
            // exports met overlappende periodes gebruiken.
            const merged = mergeTransactions(transactions, incoming);
            const nieuwe = merged.length - transactions.length;

            // Eerst opslaan, dan pas in de state. Mislukt het opslaan, dan
            // toont het scherm niet iets wat nergens bewaard is.
            await store.save(merged);
            setTransactions(merged);

            setError(null);
            setNotice(
                nieuwe === 0
                    ? `Geen nieuwe transacties: alle ${incoming.length} regels stonden er al in.`
                    : `${nieuwe} nieuwe ${nieuwe === 1 ? 'transactie' : 'transacties'} toegevoegd.`,
            );
        } catch (e) {
            // De parser faalt hard bij iets onbekends. Dan tonen we de melding
            // en laten we de opslag ongemoeid: liever niets dan half.
            setError(e instanceof Error ? e.message : String(e));
            setNotice(null);
        }
    }

    async function handleClearOverrides() {
        const zeker = window.confirm(
            `${overrides.length} ingevulde ${overrides.length === 1 ? 'verdeling' : 'verdelingen'} wissen? De aankopen komen dan opnieuw op de lijst om te verdelen.`,
        );
        if (!zeker) {
            return;
        }
        await overrideStore.clear();
        setOverrides([]);
        setError(null);
        setNotice('Ingevulde verdelingen gewist.');
    }

    async function handleClear() {
        const zeker = window.confirm(
            'Alle opgeslagen transacties wissen? Je kunt ze opnieuw inladen uit je export.',
        );
        if (!zeker) {
            return;
        }
        await store.clear();
        setTransactions([]);
        setError(null);
        setNotice('Opslag geleegd.');
    }

    // Afgeleid uit de state en dus telkens opnieuw berekend. Nooit in state
    // zetten: dan kunnen de twee uit elkaar gaan lopen (beslissing 1).
    const positions = buildPositions(transactions);
    const first = transactions.at(0);
    const last = transactions.at(-1);

    // Koersen komen uit twee bronnen: elke aankoop noteert de koers van die dag
    // (gratis), en wat je zelf opzocht voor de dagen ertussen. Bij dezelfde dag
    // en hetzelfde fonds wint je eigen invoer.
    const quotes = mergeQuotes(quotesFromTransactions(transactions), manualQuotes);
    const valueSeries = buildValueSeries(transactions, quotes);

    // De verdeling levert twee dingen: wat gelukt is, en de aankopen die op
    // geen enkele regel passen. Die laatste blokkeren de rest niet meer, maar
    // worden apart getoond zodat je ze kunt toewijzen.
    let beneficiaryPositions: BeneficiaryPosition[] = [];
    let unallocated: UnallocatedPurchase[] = [];
    let ownershipError: string | null = null;
    // Opgeslagen uitzonderingen komen eerst: allocate pakt de eerste die past,
    // dus wat je in het scherm invulde wint van wat er in het configbestand
    // staat. Zo kun je een oude regel bijsturen zonder code aan te raken.
    const effectiveConfig = {
        ...ownershipConfig,
        overrides: [...overrides, ...ownershipConfig.overrides],
    };

    try {
        const ledger = buildBeneficiaryLedger(transactions, effectiveConfig);
        beneficiaryPositions = ledger.positions;
        unallocated = ledger.unallocated;
    } catch (e) {
        // Alleen nog voor echt kapotte gegevens. Aankopen zonder passende regel
        // komen niet hier terecht maar in `unallocated`.
        ownershipError = e instanceof Error ? e.message : String(e);
    }

    return (
        <>
            <PageHeader />

            <main className="container py-4">
                <CsvUpload onFileRead={handleFileRead} />

                {error && (
                    <div className="alert alert-danger" role="alert">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {error}
                    </div>
                )}

                {notice && (
                    <div className="alert alert-success" role="alert">
                        <i className="bi bi-check-circle me-2"></i>
                        {notice}
                    </div>
                )}

                {loading && <p className="text-muted">Opgeslagen gegevens inladen...</p>}

                {!loading && transactions.length === 0 && (
                    <p className="text-muted">
                        Nog geen transacties. Kies hierboven een Revolut-export om te beginnen.
                    </p>
                )}

                {!loading && transactions.length > 0 && (
                    <>
                        <div className="card shadow-sm mb-4">
                            <div className="card-body d-flex flex-wrap align-items-center gap-3">
                                <span>
                                    <strong>{transactions.length}</strong> transacties opgeslagen
                                </span>
                                {first && last && (
                                    <span className="text-muted small">
                                        van {formatDate(first.timestamp)} tot{' '}
                                        {formatDate(last.timestamp)}
                                    </span>
                                )}
                                {/* De knoppen om verdelingen en koersen te wissen staan bij
                                    hun eigen lijst, niet hier. Zo hoort een wisknop altijd
                                    bij het overzicht van wat je wist. */}
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger ms-auto"
                                    onClick={handleClear}
                                >
                                    <i className="bi bi-trash3 me-1"></i>
                                    Transacties wissen
                                </button>
                            </div>
                        </div>

                        {ownershipError && (
                            <div className="alert alert-danger" role="alert">
                                <i className="bi bi-exclamation-triangle me-2"></i>
                                {ownershipError}
                            </div>
                        )}

                        {unallocated.length > 0 && (
                            <UnallocatedPurchases
                                unallocated={unallocated}
                                beneficiaries={ownershipConfig.beneficiaries}
                                onAssign={handleAssign}
                            />
                        )}

                        <PriceInput
                            tickers={positions.map((p) => p.ticker)}
                            quotes={quotes}
                            manualQuotes={manualQuotes}
                            onSave={handleSaveQuotes}
                            onDelete={handleDeleteQuote}
                            onClear={handleClearQuotes}
                        />

                        {valueSeries.length > 1 && <ValueChart series={valueSeries} />}

                        {beneficiaryPositions.length > 0 && (
                            <ContributionSummary
                                positions={beneficiaryPositions}
                                beneficiaries={ownershipConfig.beneficiaries}
                            />
                        )}

                        <PositionTable positions={positions} />

                        {overrides.length > 0 && (
                            <ManualOverrides
                                overrides={overrides}
                                beneficiaries={ownershipConfig.beneficiaries}
                                onDelete={handleDeleteOverride}
                                onClear={handleClearOverrides}
                            />
                        )}

                        <TransactionTable transactions={transactions} />
                    </>
                )}
            </main>
        </>
    );
}

export default App;
