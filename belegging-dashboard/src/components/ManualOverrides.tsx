import { formatDate, formatEuro } from '../format';
import type { Beneficiary, ContributionOverride } from '../models/ownership';

type ManualOverridesProps = {
    overrides: ContributionOverride[];
    beneficiaries: Beneficiary[];
    onDelete: (override: ContributionOverride) => void;
    onClear: () => void;
};

/**
 * Toont de verdelingen die je zelf hebt ingevuld voor aankopen buiten het
 * maandritme.
 *
 * Zelfde reden als bij de koersen: wat jij invoert moet je kunnen nakijken en
 * per stuk kunnen weggooien. Verwijder je er een, dan komt die aankoop weer op
 * de lijst "nog te verdelen" en kun je hem opnieuw invullen.
 *
 * De uitzonderingen uit het configbestand staan hier niet bij: die beheer je
 * daar, en ze kunnen vanuit het scherm niet gewist worden.
 */
export function ManualOverrides({
    overrides,
    beneficiaries,
    onDelete,
    onClear,
}: ManualOverridesProps) {
    // Nieuwste bovenaan, zoals bij de koersen.
    const gesorteerd = [...overrides].sort(
        (a, b) => b.date.localeCompare(a.date) || a.ticker.localeCompare(b.ticker),
    );

    return (
        <div className="card shadow-sm mb-4">
            <div className="card-header d-flex align-items-center gap-2 flex-wrap">
                <i className="bi bi-pencil trap-text-accent"></i>
                <span className="fw-semibold">Zelf ingevulde verdelingen</span>
                <span className="badge bg-secondary">{overrides.length}</span>
                <button
                    type="button"
                    className="btn btn-sm btn-link text-muted ms-auto p-0"
                    onClick={onClear}
                >
                    alles wissen
                </button>
            </div>
            <div className="table-responsive">
                <table className="table table-sm table-hover align-middle mb-0">
                    <thead>
                        <tr>
                            <th>Datum</th>
                            <th>Fonds</th>
                            {beneficiaries.map((b) => (
                                <th key={b.id} className="text-end">
                                    {b.label}
                                </th>
                            ))}
                            <th style={{ width: '1%' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {gesorteerd.map((o) => (
                            <tr key={`${o.date}|${o.ticker}`}>
                                <td className="small">{formatDate(new Date(o.date))}</td>
                                <td>
                                    <span className="badge bg-secondary">{o.ticker}</span>
                                </td>
                                {beneficiaries.map((b) => {
                                    const cents = o.contributions[b.id] ?? 0;
                                    return (
                                        <td key={b.id} className="text-end font-monospace small">
                                            {cents === 0 ? (
                                                <span className="text-muted">-</span>
                                            ) : (
                                                formatEuro(cents)
                                            )}
                                        </td>
                                    );
                                })}
                                <td className="text-end">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-link text-danger p-0"
                                        aria-label={`Verdeling van ${o.ticker} op ${o.date} verwijderen`}
                                        onClick={() => onDelete(o)}
                                    >
                                        <i className="bi bi-x-lg"></i>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
