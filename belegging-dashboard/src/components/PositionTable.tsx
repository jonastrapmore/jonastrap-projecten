import { formatEuro, formatPricePerShare, formatQuantity } from '../format';
import type { Position } from '../models/position';

type PositionTableProps = {
    positions: Position[];
};

export function PositionTable({ positions }: PositionTableProps) {
    const totalCostCents = positions.reduce((total, p) => total + p.costCents, 0);

    return (
        <div className="card shadow-sm mb-4">
            <div className="card-header d-flex align-items-center gap-2 flex-wrap">
                <i className="bi bi-pie-chart trap-text-accent"></i>
                <span className="fw-semibold">Posities</span>
                <span className="badge bg-secondary">{positions.length}</span>
                <span className="ms-auto small text-muted">
                    totaal: <strong>{formatEuro(totalCostCents)}</strong>
                </span>
            </div>
            <div className="table-responsive">
                <table className="table table-sm table-hover align-middle mb-0">
                    <thead>
                        <tr>
                            <th>Fonds</th>
                            <th className="text-center">Aankopen</th>
                            <th className="text-end">Aandelen</th>
                            <th className="text-end">Kostprijs</th>
                            <th className="text-end">Gem. aankoopprijs</th>
                        </tr>
                    </thead>
                    <tbody>
                        {positions.map((p) => (
                            <tr key={p.ticker}>
                                <td>{p.ticker}</td>
                                <td className="text-center">{p.purchaseCount}</td>
                                <td className="text-end">{formatQuantity(p.quantityE8)}</td>
                                <td className="text-end">{formatEuro(p.costCents)}</td>
                                <td className="text-end">
                                    {formatPricePerShare(p.costCents / (p.quantityE8 / 1e8))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
