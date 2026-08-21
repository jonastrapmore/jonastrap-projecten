import { ContributionSummary } from './components/ContributionSummary';
import { CsvUpload } from './components/CsvUpload';
import { ManualOverrides } from './components/ManualOverrides';
import { PageHeader } from './components/PageHeader';
import { PositionTable } from './components/PositionTable';
import { PriceInput } from './components/PriceInput';
import { TransactionTable } from './components/TransactionTable';
import { UnallocatedPurchases } from './components/UnallocatedPurchases';
import { ValueChart } from './components/ValueChart';
import { ownershipConfig } from './config/verdeling';
import { deriveDashboard } from './dashboard';
import { formatDate } from './format';
import { useDashboardData } from './useDashboardData';

/**
 * Zet de onderdelen samen. Meer doet dit bestand niet.
 *
 * De rolverdeling: useDashboardData beheert wat bewaard wordt, deriveDashboard
 * rekent uit wat daaruit volgt, en App bepaalt hoe het op het scherm komt.
 * Zo blijft de berekening testbaar zonder browser en blijft dit bestand een
 * inhoudsopgave in plaats van een verzamelplaats.
 */
function App() {
    const data = useDashboardData();
    const view = deriveDashboard(
        data.transactions,
        data.overrides,
        data.manualQuotes,
        ownershipConfig,
    );

    return (
        <>
            <PageHeader />

            <main className="container py-4">
                <CsvUpload onFileRead={data.importCsv} />

                {data.error && (
                    <div className="alert alert-danger" role="alert">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {data.error}
                    </div>
                )}

                {data.notice && (
                    <div className="alert alert-success" role="alert">
                        <i className="bi bi-check-circle me-2"></i>
                        {data.notice}
                    </div>
                )}

                {data.loading && <p className="text-muted">Opgeslagen gegevens inladen...</p>}

                {!data.loading && data.transactions.length === 0 && (
                    <p className="text-muted">
                        Nog geen transacties. Kies hierboven een Revolut-export om te beginnen.
                    </p>
                )}

                {!data.loading && data.transactions.length > 0 && (
                    <>
                        <div className="card shadow-sm mb-4">
                            <div className="card-body d-flex flex-wrap align-items-center gap-3">
                                <span>
                                    <strong>{data.transactions.length}</strong> transacties
                                    opgeslagen
                                </span>
                                {view.firstTransaction && view.lastTransaction && (
                                    <span className="text-muted small">
                                        van {formatDate(view.firstTransaction.timestamp)} tot{' '}
                                        {formatDate(view.lastTransaction.timestamp)}
                                    </span>
                                )}
                                {/* De knoppen om verdelingen en koersen te wissen staan bij
                                    hun eigen lijst, niet hier. Zo hoort een wisknop altijd
                                    bij het overzicht van wat je wist. */}
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

                        {view.ownershipError && (
                            <div className="alert alert-danger" role="alert">
                                <i className="bi bi-exclamation-triangle me-2"></i>
                                {view.ownershipError}
                            </div>
                        )}

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

                        {view.valueSeries.length > 1 && <ValueChart series={view.valueSeries} />}

                        {view.beneficiaryPositions.length > 0 && (
                            <ContributionSummary
                                positions={view.beneficiaryPositions}
                                beneficiaries={ownershipConfig.beneficiaries}
                            />
                        )}

                        <PositionTable positions={view.positions} />

                        {data.overrides.length > 0 && (
                            <ManualOverrides
                                overrides={data.overrides}
                                beneficiaries={ownershipConfig.beneficiaries}
                                onDelete={data.deleteOverride}
                                onClear={data.clearOverrides}
                            />
                        )}

                        <TransactionTable transactions={data.transactions} />
                    </>
                )}
            </main>
        </>
    );
}

export default App;
