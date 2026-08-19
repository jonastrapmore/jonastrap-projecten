import type { Transaction } from '../models/transaction';
import { formatDate, formatEuro, formatQuantity } from '../format';

type TransactionTableProps = {
    transactions: Transaction[];
};

/**
 * Toont alle ingelezen transacties, met bovenaan het totaal ingelegd
 * kapitaal. Dat totaal telt enkel aankopen: elke aankoop wordt in de
 * export voorafgegaan door een storting van hetzelfde bedrag, en beide
 * meetellen zou de inleg verdubbelen.
 */
export function TransactionTable({ transactions }: TransactionTableProps) {
    // Afgeleid uit de props, niet in state bewaard: bij elke hertekening
    // opnieuw berekend, dus het kan nooit uit de pas lopen.
    const purchases = transactions.filter((t) => t.type === 'BUY');
    const investedCents = purchases.reduce((total, t) => total + t.amountCents, 0);

    return (
        <div className="card shadow-sm">
            <div className="card-header d-flex align-items-center gap-2 flex-wrap">
                <i className="bi bi-list-ul trap-text-accent"></i>
                <span className="fw-semibold">Transacties</span>
                <span className="badge bg-secondary">{transactions.length}</span>
                <span className="ms-auto small text-muted">
                    Ingelegd over {purchases.length} aankopen:{' '}
                    <strong className="trap-text-primary">{formatEuro(investedCents)}</strong>
                </span>
            </div>
            <div className="table-responsive">
                <table className="table table-sm table-hover align-middle mb-0">
                    <thead>
                        <tr>
                            <th>Datum</th>
                            <th>Type</th>
                            <th>Fonds</th>
                            <th className="text-end">Aantal</th>
                            <th className="text-end">Bedrag</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((t) => (
                            <tr key={t.id}>
                                <td>{formatDate(t.timestamp)}</td>
                                <td>
                                    {t.type === 'BUY' ? (
                                        <span className="badge bg-success">Aankoop</span>
                                    ) : (
                                        <span className="badge bg-secondary">Storting</span>
                                    )}
                                </td>
                                <td>{t.ticker ?? ''}</td>
                                <td className="text-end font-monospace small">
                                    {formatQuantity(t.quantityE8)}
                                </td>
                                <td className="text-end font-monospace">
                                    {formatEuro(t.amountCents)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
