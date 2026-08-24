import { fundLabel } from '../funds';
import { useState } from 'react';
import { formatDate, formatEuro, parseEuroInput } from '../format';
import type { Beneficiary, ContributionOverride, UnallocatedPurchase } from '../models/ownership';

type PurchaseRowProps = {
    purchase: UnallocatedPurchase;
    beneficiaries: Beneficiary[];
    onAssign: (override: ContributionOverride) => void;
};

/**
 * Een enkele aankoop met een invoerveld per begunstigde.
 *
 * Elke rij houdt zijn eigen invoer bij. Zou die state in de lijst erboven
 * staan, dan moest die bijhouden welke waarde bij welke rij hoort, en dat is
 * precies het soort boekhouding dat je niet wil.
 */
function PurchaseRow({ purchase, beneficiaries, onAssign }: PurchaseRowProps) {
    // Wat er in de velden staat, als tekst. Bewust niet als getal: dan kun je
    // geen half getypt bedrag laten staan terwijl iemand nog bezig is.
    const [amounts, setAmounts] = useState<Record<string, string>>(() =>
        Object.fromEntries(beneficiaries.map((b) => [b.id, ''])),
    );

    const target = purchase.transaction.amountCents;
    const entered = beneficiaries.map((b) => parseEuroInput(amounts[b.id] ?? ''));
    const invalid = entered.some((c) => c === null);
    // De <number> is nodig omdat `entered` van het type (number | null)[] is:
    // zonder die hint denkt TypeScript dat de teller ook null kan worden.
    const total = invalid ? null : entered.reduce<number>((sum, c) => sum + (c ?? 0), 0);
    const difference = total === null ? null : target - total;
    const canSave = difference === 0;

    function handleChange(id: string, value: string) {
        // Nieuw object in plaats van het bestaande aanpassen: React vergelijkt
        // op identiteit om te bepalen of hij moet hertekenen.
        setAmounts({ ...amounts, [id]: value });
    }

    function handleAssign() {
        onAssign({
            date: purchase.date,
            ticker: purchase.ticker,
            contributions: Object.fromEntries(beneficiaries.map((b, i) => [b.id, entered[i] ?? 0])),
        });
    }

    return (
        <div className="border rounded p-3 mb-3">
            <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
                <span className="fw-semibold">{formatDate(purchase.transaction.timestamp)}</span>
                <span className="badge bg-secondary" title={purchase.ticker}>
                    {fundLabel(purchase.ticker)}
                </span>
                <span className="font-monospace">{formatEuro(target)}</span>
                <span className="text-muted small ms-auto">te verdelen</span>
            </div>

            {/* De reden erbij, want die verschilt: soms is er geen regel, soms
                klopt een eerder ingevulde verdeling niet meer met het bedrag. */}
            <p className="text-muted small mb-3">{purchase.reason}</p>

            <div className="row g-2 align-items-end">
                {beneficiaries.map((b) => (
                    <div className="col-sm" key={b.id}>
                        <label
                            className="form-label small mb-1"
                            htmlFor={`${purchase.transaction.id}-${b.id}`}
                        >
                            {b.label}
                        </label>
                        <div className="input-group input-group-sm">
                            <span className="input-group-text">EUR</span>
                            <input
                                id={`${purchase.transaction.id}-${b.id}`}
                                type="text"
                                inputMode="decimal"
                                className={`form-control ${parseEuroInput(amounts[b.id] ?? '') === null ? 'is-invalid' : ''}`}
                                placeholder="0,00"
                                value={amounts[b.id] ?? ''}
                                onChange={(e) => handleChange(b.id, e.target.value)}
                            />
                        </div>
                    </div>
                ))}

                <div className="col-sm-auto">
                    <button
                        type="button"
                        className="btn btn-sm btn-custom trap-bg-primary"
                        disabled={!canSave}
                        onClick={handleAssign}
                    >
                        <i className="bi bi-check-lg me-1"></i>
                        Toewijzen
                    </button>
                </div>
            </div>

            <div className="small mt-2">
                {invalid && (
                    <span className="text-danger">
                        Vul enkel bedragen in, bijvoorbeeld 200 of 200,50.
                    </span>
                )}
                {!invalid && difference !== null && difference !== 0 && (
                    <span className="text-warning">
                        Nog {formatEuro(Math.abs(difference))}{' '}
                        {difference > 0 ? 'te verdelen' : 'te veel'}.
                    </span>
                )}
                {canSave && <span className="text-success">Telt op tot het aankoopbedrag.</span>}
            </div>
        </div>
    );
}

type UnallocatedPurchasesProps = {
    unallocated: UnallocatedPurchase[];
    beneficiaries: Beneficiary[];
    onAssign: (override: ContributionOverride) => void;
};

/**
 * Toont de aankopen die op geen enkele inlegregel passen, met per aankoop de
 * mogelijkheid om de verdeling in te vullen.
 *
 * Wat je hier invult wordt bewaard. Je krijgt dezelfde vraag dus maar een
 * keer, ook al laad je dezelfde export volgend jaar opnieuw in.
 */
export function UnallocatedPurchases({
    unallocated,
    beneficiaries,
    onAssign,
}: UnallocatedPurchasesProps) {
    const openCents = unallocated.reduce((sum, u) => sum + u.transaction.amountCents, 0);

    return (
        <div className="card shadow-sm mb-4 border-warning">
            <div className="card-header d-flex align-items-center gap-2 flex-wrap">
                <i className="bi bi-question-circle trap-text-accent"></i>
                <span className="fw-semibold">Nog te verdelen</span>
                <span className="badge bg-warning text-dark">{unallocated.length}</span>
                <span className="ms-auto small text-muted">
                    Samen <strong>{formatEuro(openCents)}</strong>, nog niet meegeteld per persoon
                </span>
            </div>
            <div className="card-body">
                <p className="text-muted small">
                    Deze aankopen wijken af van de vaste inlegregels. Vul in wie hoeveel inlegde;
                    het wordt bewaard, dus je krijgt deze vraag maar een keer.
                </p>

                {unallocated.map((u) => (
                    <PurchaseRow
                        key={u.transaction.id}
                        purchase={u}
                        beneficiaries={beneficiaries}
                        onAssign={onAssign}
                    />
                ))}
            </div>
        </div>
    );
}
