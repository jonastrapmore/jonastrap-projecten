import { useState } from 'react';
import { CsvUpload } from './components/CsvUpload';
import { PageHeader } from './components/PageHeader';
import { PositionTable } from './components/PositionTable';
import { TransactionTable } from './components/TransactionTable';
import { parseRevolutCsv } from './data/revolutParser';
import { buildPositions } from './ledger';
import type { Transaction } from './models/transaction';

/**
 * Houdt de ingelezen transacties bij en zet de onderdelen samen.
 * De state staat hier omdat meer dan een component hem nodig heeft.
 */
function App() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [error, setError] = useState<string | null>(null);

    function handleFileRead(text: string) {
        try {
            setTransactions(parseRevolutCsv(text));
            setError(null);
        } catch (e) {
            // De parser faalt hard bij iets onbekends. Dat tonen we,
            // in plaats van de gebruiker met een leeg scherm achter te laten.
            setTransactions([]);
            setError(e instanceof Error ? e.message : String(e));
        }
    }

    const positions = buildPositions(transactions);

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

                {transactions.length > 0 && (
                    <>
                        <PositionTable positions={positions} />
                        <TransactionTable transactions={transactions} />
                    </>
                )}
            </main>
        </>
    );
}

export default App;
