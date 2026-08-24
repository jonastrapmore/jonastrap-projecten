import { saleCostRuleAt } from '../config/costs';
import { formatEuro } from '../format';
import type { Beneficiary } from '../models/ownership';
import type { BeneficiaryPerformance } from '../performance';
import { today } from '../valuation';

type PayoutSummaryProps = {
    performance: BeneficiaryPerformance[];
    beneficiaries: Beneficiary[];
};

/**
 * Per persoon: inleg, waarde, winst en wat er na verkoop overblijft.
 *
 * Het nettobedrag staat er met een uitdrukkelijk voorbehoud bij. Zolang het
 * tarief op de meerwaarde niet nagekeken is, is dit het bedrag min de
 * beurstaks en niets anders. Een getal dat afgewerkt oogt maar een post mist,
 * is misleidender dan geen getal.
 */
export function PayoutSummary({ performance, beneficiaries }: PayoutSummaryProps) {
    const rule = saleCostRuleAt(today());
    const meerwaardeOnbekend = rule.capitalGainsBasisPoints === 0;

    const label = (id: string) => beneficiaries.find((b) => b.id === id)?.label ?? id;

    return (
        <div className="card shadow-sm mb-4">
            <div className="card-header d-flex align-items-center gap-2">
                <i className="bi bi-people trap-text-accent"></i>
                <span className="fw-semibold">Per begunstigde</span>
            </div>
            <div className="table-responsive">
                <table className="table table-sm table-hover align-middle mb-0">
                    <thead>
                        <tr>
                            <th>Persoon</th>
                            <th className="text-end">Ingelegd</th>
                            <th className="text-end">Waarde nu</th>
                            <th className="text-end">Resultaat</th>
                            <th className="text-end">Beurstaks</th>
                            <th className="text-end">Netto bij verkoop</th>
                        </tr>
                    </thead>
                    <tbody>
                        {performance.map((p) => {
                            const positief = (p.gainCents ?? 0) >= 0;
                            return (
                                <tr key={p.beneficiary}>
                                    <td>{label(p.beneficiary)}</td>
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
                                        {p.gainCents === null ? (
                                            <span className="text-muted">-</span>
                                        ) : (
                                            <span
                                                className={
                                                    positief ? 'text-success' : 'text-danger'
                                                }
                                            >
                                                {positief ? '+' : ''}
                                                {formatEuro(p.gainCents)}
                                                <span className="ms-2 small">
                                                    ({positief ? '+' : ''}
                                                    {((p.gainCents / p.costCents) * 100).toFixed(
                                                        1,
                                                    )}{' '}
                                                    %)
                                                </span>
                                            </span>
                                        )}
                                    </td>
                                    <td className="text-end font-monospace text-muted small">
                                        {p.saleTaxCents === null
                                            ? '-'
                                            : `-${formatEuro(p.saleTaxCents)}`}
                                    </td>
                                    <td className="text-end font-monospace fw-semibold">
                                        {p.netCents === null ? (
                                            <span className="text-muted">-</span>
                                        ) : (
                                            formatEuro(p.netCents)
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="card-footer small text-muted">
                {meerwaardeOnbekend ? (
                    <>
                        <i className="bi bi-info-circle me-1"></i>
                        Netto is de waarde min de beurstaks van{' '}
                        {(rule.transactionTaxBasisPoints / 100).toFixed(2).replace('.', ',')}{' '}
                        procent bij verkoop. Er is{' '}
                        <strong>nog geen belasting op de meerwaarde</strong> ingerekend: dat tarief
                        staat op nul in de configuratie tot het nagekeken is. Het werkelijke bedrag
                        kan dus lager liggen.
                    </>
                ) : (
                    <>
                        <i className="bi bi-info-circle me-1"></i>
                        Netto is de waarde min de beurstaks en de belasting op de meerwaarde,
                        volgens de tarieven in de configuratie.
                    </>
                )}
            </div>
        </div>
    );
}
