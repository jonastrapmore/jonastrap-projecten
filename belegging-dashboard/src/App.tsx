import { useEffect, useState } from 'react';
import { CsvUpload } from './components/CsvUpload';
import { PageHeader } from './components/PageHeader';
import { PositionTable } from './components/PositionTable';
import { TransactionTable } from './components/TransactionTable';
import { localStorageTransactionStore } from './data/localStorageTransactionStore';
import { mergeTransactions } from './data/mergeTransactions';
import { parseRevolutCsv } from './data/revolutParser';
import { formatDate } from './format';
import { buildPositions } from './ledger';
import type { Transaction } from './models/transaction';

// Buiten de component. Deze opslag hoort niet bij de levensduur van App:
// er is er een, hij bestaat al voor de eerste weergave, en hij blijft na de
// laatste. Zo is ook meteen duidelijk dat hij niet in de useEffect-lijst
// hieronder hoeft te staan.
const store = localStorageTransactionStore;

/**
 * Houdt de transacties bij en zet de onderdelen samen. De state staat hier
 * omdat meer dan een component hem nodig heeft.
 */
function App() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    // Blijft true tot de opslag uitgelezen is. Zonder deze vlag flitst er bij
    // het openen heel even "nog geen transacties" voorbij.
    const [loading, setLoading] = useState(true);

    // Draait een keer, na de eerste weergave. Dat is wat die lege [] betekent.
    // Zonder die haken zou hij bij elke hertekening opnieuw draaien, en omdat
    // hij zelf de state aanpast zou dat een oneindige lus worden.
    useEffect(() => {
        store
            .load()
            .then((stored) => setTransactions(stored))
            .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
            .finally(() => setLoading(false));
    }, []);

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
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger ms-auto"
                                    onClick={handleClear}
                                >
                                    <i className="bi bi-trash3 me-1"></i>
                                    Opslag wissen
                                </button>
                            </div>
                        </div>

                        <PositionTable positions={positions} />
                        <TransactionTable transactions={transactions} />
                    </>
                )}
            </main>
        </>
    );
}

export default App;
