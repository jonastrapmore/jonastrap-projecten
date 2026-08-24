import { ContributionSummary } from '../components/ContributionSummary';
import { CsvUpload } from '../components/CsvUpload';
import { ManualOverrides } from '../components/ManualOverrides';
import { PriceInput } from '../components/PriceInput';
import { TransactionTable } from '../components/TransactionTable';
import { UnallocatedPurchases } from '../components/UnallocatedPurchases';
import { ownershipConfig } from '../config/verdeling';
import { formatDate } from '../format';
import { useDashboard } from './DashboardContext';

/**
 * Alles wat met bijwerken en beheren te maken heeft: een export inladen,
 * koersen bijwerken, en de verdelingen die je zelf invulde nakijken.
 */
export function UpdatePage() {
    const { data, view } = useDashboard();

    return (
        <>
            <CsvUpload onFileRead={data.importCsv} />

            {data.transactions.length === 0 && (
                <p className="text-muted">
                    Nog geen transacties. Kies hierboven een Revolut-export om te beginnen.
                </p>
            )}

            {data.transactions.length > 0 && (
                <>
                    <div className="card shadow-sm mb-4">
                        <div className="card-body d-flex flex-wrap align-items-center gap-3">
                            <span>
                                <strong>{data.transactions.length}</strong> transacties opgeslagen
                            </span>
                            {view.firstTransaction && view.lastTransaction && (
                                <span className="text-muted small">
                                    van {formatDate(view.firstTransaction.timestamp)} tot{' '}
                                    {formatDate(view.lastTransaction.timestamp)}
                                </span>
                            )}
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-danger ms-auto"
                                onClick={data.clearTransactions}
                            >
                                <i className="bi bi-trash3 me-1"></i>
                                Transacties wissen
                            </button>
                        </div>
                    </div>

                    {view.unallocated.length > 0 && (
                        <UnallocatedPurchases
                            unallocated={view.unallocated}
                            beneficiaries={ownershipConfig.beneficiaries}
                            onAssign={data.saveOverride}
                        />
                    )}

                    <PriceInput
                        tickers={view.positions.map((p) => p.ticker)}
                        quotes={view.quotes}
                        manualQuotes={data.manualQuotes}
                        onSave={data.saveQuotes}
                        onDelete={data.deleteQuote}
                        onClear={data.clearQuotes}
                    />

                    {data.overrides.length > 0 && (
                        <ManualOverrides
                            overrides={data.overrides}
                            beneficiaries={ownershipConfig.beneficiaries}
                            onDelete={data.deleteOverride}
                            onClear={data.clearOverrides}
                        />
                    )}

                    {view.beneficiaryPositions.length > 0 && (
                        <ContributionSummary
                            positions={view.beneficiaryPositions}
                            beneficiaries={ownershipConfig.beneficiaries}
                        />
                    )}

                    <TransactionTable transactions={data.transactions} />
                </>
            )}
        </>
    );
}
