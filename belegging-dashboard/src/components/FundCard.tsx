import type { ReactNode } from 'react';
import Accordion from 'react-bootstrap/Accordion';
import { formatEuro, formatPricePerShare, formatQuantity } from '../format';
import { findFund, fundColor } from '../funds';
import type { Beneficiary } from '../models/ownership';
import type { PriceQuote } from '../models/price';
import type { BeneficiaryFundPerformance, PositionPerformance } from '../performance';
import { useTheme } from '../useTheme';
import { priceAt, today } from '../valuation';

type FundCardProps = {
    fund: PositionPerformance;
    /** Alleen de regels van dit fonds. */
    shares: BeneficiaryFundPerformance[];
    beneficiaries: Beneficiary[];
    quotes: PriceQuote[];
    purchaseCount: number;
};

/** Een bedrag met teken en kleur, eventueel met het percentage erachter. */
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

/** Een label met een waarde eronder, zoals de tegels op het overzicht. */
function Tile({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="col-6 col-lg-3">
            <div className="text-muted small text-uppercase ls-1">{label}</div>
            <div className="fs-6 font-monospace">{children}</div>
        </div>
    );
}

/**
 * Een fonds als uitklapbaar blok.
 *
 * Dichtgeklapt staan de naam, de waarde en het rendement op een regel, zodat de
 * lijst zelf al de vergelijking is en je niets hoeft open te klikken om te zien
 * welk fonds het goed doet. Uitgeklapt komt de rest erbij.
 */
export function FundCard({ fund, shares, beneficiaries, quotes, purchaseCount }: FundCardProps) {
    const theme = useTheme();
    const meta = findFund(fund.ticker);
    const price = priceAt(quotes, fund.ticker, today());

    // Gemiddelde aankoopprijs: betaald gedeeld door gekregen. Kommagetal, maar
    // puur voor weergave; er wordt niet mee doorgerekend.
    const avgPriceCents = fund.quantityE8 === 0 ? null : fund.costCents / (fund.quantityE8 / 1e8);

    const label = (id: string) => beneficiaries.find((b) => b.id === id)?.label ?? id;
    const rendement =
        fund.gainCents === null || fund.costCents === 0
            ? null
            : (fund.gainCents / fund.costCents) * 100;

    return (
        <Accordion.Item eventKey={fund.ticker} className="mb-3 shadow-sm">
            <Accordion.Header>
                <div className="d-flex align-items-center gap-2 flex-grow-1 pe-3 flex-wrap">
                    <span
                        className="rounded-circle flex-shrink-0"
                        style={{
                            width: 10,
                            height: 10,
                            backgroundColor: fundColor(fund.ticker, theme),
                        }}
                        aria-hidden="true"
                    />
                    <span className="fw-semibold">{meta?.label ?? fund.ticker}</span>
                    <span className="text-muted small font-monospace">{fund.ticker}</span>

                    <span className="ms-auto d-flex align-items-center gap-3 font-monospace">
                        <span>
                            {fund.valueCents === null ? (
                                <span className="text-muted small">geen koers</span>
                            ) : (
                                formatEuro(fund.valueCents)
                            )}
                        </span>
                        {rendement !== null && (
                            <span
                                className={`small ${rendement >= 0 ? 'text-success' : 'text-danger'}`}
                            >
                                {rendement >= 0 ? '+' : ''}
                                {rendement.toFixed(1)} %
                            </span>
                        )}
                    </span>
                </div>
            </Accordion.Header>

            <Accordion.Body>
                {meta && <p className="text-muted small mb-3">{meta.fullName}</p>}

                <div className="row g-3 mb-3">
                    <Tile label="Ingelegd">{formatEuro(fund.costCents)}</Tile>
                    <Tile label="Waarde nu">
                        {fund.valueCents === null ? (
                            <span className="text-muted">geen koers</span>
                        ) : (
                            formatEuro(fund.valueCents)
                        )}
                    </Tile>
                    <Tile label="Resultaat">
                        <Gain cents={fund.gainCents} costCents={fund.costCents} />
                    </Tile>
                    <Tile label="Aandelen">{formatQuantity(fund.quantityE8)}</Tile>
                </div>

                <div className="row g-3 border-top pt-3">
                    <Tile label="Gem. aankoopprijs">
                        {avgPriceCents === null ? '-' : formatPricePerShare(avgPriceCents)}
                    </Tile>
                    <Tile label="Koers nu">{price === null ? '-' : formatEuro(price)}</Tile>
                    <Tile label="Aankopen">{purchaseCount}</Tile>
                    <Tile label="ISIN">
                        <span className="small">{meta?.isin ?? '-'}</span>
                    </Tile>
                </div>

                {shares.length > 0 && (
                    <div className="table-responsive border-top mt-3">
                        <table className="table table-sm table-hover align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Verdeling</th>
                                    <th className="text-end">Aandelen</th>
                                    <th className="text-end">Ingelegd</th>
                                    <th className="text-end">Waarde nu</th>
                                    <th className="text-end">Resultaat</th>
                                    <th className="text-end">Aandeel</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shares.map((s) => (
                                    <tr key={s.beneficiary}>
                                        <td>{label(s.beneficiary)}</td>
                                        <td className="text-end font-monospace small">
                                            {formatQuantity(s.quantityE8)}
                                        </td>
                                        <td className="text-end font-monospace">
                                            {formatEuro(s.costCents)}
                                        </td>
                                        <td className="text-end font-monospace">
                                            {s.valueCents === null ? (
                                                <span className="text-muted">-</span>
                                            ) : (
                                                formatEuro(s.valueCents)
                                            )}
                                        </td>
                                        <td className="text-end font-monospace">
                                            <Gain cents={s.gainCents} costCents={s.costCents} />
                                        </td>
                                        <td className="text-end font-monospace">
                                            {/* Aandeel op basis van waarde, niet van inleg: dat
                                                is wat iemand vandaag bezit, en dat schuift mee
                                                met de koers. */}
                                            {fund.valueCents === null ||
                                            fund.valueCents === 0 ||
                                            s.valueCents === null
                                                ? '-'
                                                : `${((s.valueCents / fund.valueCents) * 100).toFixed(1)} %`}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Accordion.Body>
        </Accordion.Item>
    );
}
