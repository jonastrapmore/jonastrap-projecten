import { formatEuro } from '../format';
import type { Beneficiary } from '../models/ownership';
import type { BeneficiaryPosition } from '../models/position';

type ContributionSummaryProps = {
    positions: BeneficiaryPosition[];
    /** Nodig voor de kolomvolgorde en de weergavenamen. */
    beneficiaries: Beneficiary[];
};

/**
 * Toont per fonds wie hoeveel inlegde, met totalen en het aandeel per persoon.
 *
 * Vervangt het handmatig bijgehouden overzicht: alles hier wordt herberekend
 * uit de transacties en de inlegregels, dus het kan niet uit de pas lopen met
 * de werkelijke aankopen.
 */
export function ContributionSummary({ positions, beneficiaries }: ContributionSummaryProps) {
    // Unieke fondsen uit de posities. Een Set gooit dubbele weg, de spread
    // maakt er weer een array van zodat we kunnen sorteren en mappen.
    const tickers = [...new Set(positions.map((p) => p.ticker))].sort();

    // De posities komen binnen als platte lijst. Voor een tabel met fondsen als
    // rijen en personen als kolommen hebben we willekeurige toegang nodig,
    // vandaar deze opzoektabel op dezelfde samengestelde sleutel als in het ledger.
    const costByKey = new Map(positions.map((p) => [`${p.beneficiary}|${p.ticker}`, p.costCents]));

    // Nul betekent hier "deze persoon zit niet in dit fonds". Dat is geen
    // verzonnen waarde: als er geen inleg is, is het bedrag ook echt nul.
    const cost = (beneficiaryId: string, ticker: string) =>
        costByKey.get(`${beneficiaryId}|${ticker}`) ?? 0;

    const rowTotal = (ticker: string) =>
        beneficiaries.reduce((sum, b) => sum + cost(b.id, ticker), 0);

    const columnTotal = (beneficiaryId: string) =>
        tickers.reduce((sum, t) => sum + cost(beneficiaryId, t), 0);

    const grandTotal = positions.reduce((sum, p) => sum + p.costCents, 0);

    return (
        <div className="card shadow-sm mb-4">
            <div className="card-header d-flex align-items-center gap-2 flex-wrap">
                <i className="bi bi-people trap-text-accent"></i>
                <span className="fw-semibold">Inleg per begunstigde</span>
                <span className="ms-auto small text-muted">
                    Totaal ingelegd:{' '}
                    <strong className="trap-text-primary">{formatEuro(grandTotal)}</strong>
                </span>
            </div>
            <div className="table-responsive">
                <table className="table table-sm table-hover align-middle mb-0">
                    <thead>
                        <tr>
                            <th>Fonds</th>
                            {beneficiaries.map((b) => (
                                <th key={b.id} className="text-end">
                                    {b.label}
                                </th>
                            ))}
                            <th className="text-end">Totaal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tickers.map((ticker) => (
                            <tr key={ticker}>
                                <td>{ticker}</td>
                                {beneficiaries.map((b) => {
                                    const cents = cost(b.id, ticker);
                                    return (
                                        <td key={b.id} className="text-end font-monospace">
                                            {/* Een streepje leest rustiger dan een rij nullen */}
                                            {cents === 0 ? (
                                                <span className="text-muted">-</span>
                                            ) : (
                                                formatEuro(cents)
                                            )}
                                        </td>
                                    );
                                })}
                                <td className="text-end font-monospace">
                                    {formatEuro(rowTotal(ticker))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="border-top">
                        <tr className="fw-semibold">
                            <td>Ingelegd</td>
                            {beneficiaries.map((b) => (
                                <td key={b.id} className="text-end font-monospace">
                                    {formatEuro(columnTotal(b.id))}
                                </td>
                            ))}
                            <td className="text-end font-monospace">{formatEuro(grandTotal)}</td>
                        </tr>
                        <tr className="text-muted small">
                            <td>Aandeel</td>
                            {beneficiaries.map((b) => (
                                <td key={b.id} className="text-end font-monospace">
                                    {grandTotal === 0
                                        ? '-'
                                        : `${((columnTotal(b.id) / grandTotal) * 100).toFixed(1)} %`}
                                </td>
                            ))}
                            <td className="text-end font-monospace">100,0 %</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
