import { FundName } from './FundName';
import { formatEuro } from '../format';
import type { PositionPerformance } from '../performance';

type FundPerformanceProps = {
    performance: PositionPerformance[];
};

/** Toont een bedrag met teken en de bijbehorende kleur, of een streepje. */
function Gain({ cents, costCents }: { cents: number | null; costCents: number }) {
    if (cents === null) {
        return <span className="text-muted">-</span>;
    }
    const positief = cents >= 0;
    return (
        <span className={positief ? 'text-success' : 'text-danger'}>
            {positief ? '+' : ''}
            {formatEuro(cents)}
            {costCents > 0 && (
                <span className="ms-2 small">
                    ({positief ? '+' : ''}
                    {((cents / costCents) * 100).toFixed(1)} %)
                </span>
            )}
        </span>
    );
}

/**
 * Per fonds: wat erin ging, wat het nu waard is en wat dat opleverde.
 *
 * Het percentage staat naast het bedrag en niet in een eigen kolom: het is
 * dezelfde informatie in een andere eenheid, en twee kolommen zouden
 * suggereren dat het twee metingen zijn.
 */
export function FundPerformance({ performance }: FundPerformanceProps) {
    const totalCost = performance.reduce((s, p) => s + p.costCents, 0);
    // Ontbreekt er ergens een koers, dan is het totaal onbekend in plaats van
    // te laag: een getal dat te laag is maar betrouwbaar oogt, is erger.
    const totalValue = performance.some((p) => p.valueCents === null)
        ? null
        : performance.reduce((s, p) => s + (p.valueCents ?? 0), 0);

    return (
        <div className="card shadow-sm mb-4">
            <div className="card-header d-flex align-items-center gap-2">
                <i className="bi bi-pie-chart trap-text-accent"></i>
                <span className="fw-semibold">Per fonds</span>
            </div>
            <div className="table-responsive">
                <table className="table table-sm table-hover align-middle mb-0">
                    <thead>
                        <tr>
                            <th>Fonds</th>
                            <th className="text-end">Ingelegd</th>
                            <th className="text-end">Waarde nu</th>
                            <th className="text-end">Resultaat</th>
                        </tr>
                    </thead>
                    <tbody>
                        {performance.map((p) => (
                            <tr key={p.ticker}>
                                <td>
                                    <FundName ticker={p.ticker} />
                                </td>
                                <td className="text-end font-monospace">
                                    {formatEuro(p.costCents)}
                                </td>
                                <td className="text-end font-monospace">
                                    {p.valueCents === null ? (
                                        <span className="text-muted">geen koers</span>
                                    ) : (
                                        formatEuro(p.valueCents)
                                    )}
                                </td>
                                <td className="text-end font-monospace">
                                    <Gain cents={p.gainCents} costCents={p.costCents} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="border-top">
                        <tr className="fw-semibold">
                            <td>Totaal</td>
                            <td className="text-end font-monospace">{formatEuro(totalCost)}</td>
                            <td className="text-end font-monospace">
                                {totalValue === null ? (
                                    <span className="text-muted">-</span>
                                ) : (
                                    formatEuro(totalValue)
                                )}
                            </td>
                            <td className="text-end font-monospace">
                                <Gain
                                    cents={totalValue === null ? null : totalValue - totalCost}
                                    costCents={totalCost}
                                />
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
