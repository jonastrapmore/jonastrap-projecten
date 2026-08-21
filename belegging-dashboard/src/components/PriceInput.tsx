import { useState } from 'react';
import { formatDate, formatEuro, parseEuroInput } from '../format';
import type { PriceQuote } from '../models/price';
import { priceAt } from '../valuation';

type PriceInputProps = {
    /** De fondsen die je bezit, in vaste volgorde. */
    tickers: string[];
    /** Alle bekende koersen, om de laatst bekende per fonds te tonen. */
    quotes: PriceQuote[];
    /** Wat je zelf hebt ingevoerd. Wordt onderaan getoond om na te kijken. */
    manualQuotes: PriceQuote[];
    onSave: (quotes: PriceQuote[]) => void;
    onDelete: (quote: PriceQuote) => void;
    onClear: () => void;
};

/** Vandaag als YYYY-MM-DD, in lokale tijd. */
function today(): string {
    const now = new Date();
    const maand = String(now.getMonth() + 1).padStart(2, '0');
    const dag = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${maand}-${dag}`;
}

/**
 * Laat je per fonds de koers van een dag invullen, en toont eronder wat je
 * eerder invoerde.
 *
 * Dat lijstje is niet decoratief: zonder overzicht ontdek je een typfout pas
 * doordat de grafiek er raar uitziet, en dan weet je nog niet welke dag het
 * was. Alles wat je zelf invoert hoort zichtbaar en per stuk verwijderbaar
 * te zijn.
 */
export function PriceInput({
    tickers,
    quotes,
    manualQuotes,
    onSave,
    onDelete,
    onClear,
}: PriceInputProps) {
    const [date, setDate] = useState(today);
    const [prices, setPrices] = useState<Record<string, string>>({});

    const parsed = tickers.map((t) => ({ ticker: t, cents: parseEuroInput(prices[t] ?? '') }));
    const invalid = parsed.some((p) => p.cents === null);
    // Een leeg veld geeft 0 terug en slaan we over: je hoeft niet elk fonds in
    // te vullen om te kunnen bewaren.
    const filled = parsed.filter((p) => p.cents !== null && p.cents > 0);
    const canSave = !invalid && filled.length > 0 && date !== '';

    // Nieuwste bovenaan: wat je net invoerde wil je als eerste kunnen nakijken.
    const eigen = [...manualQuotes].sort(
        (a, b) => b.date.localeCompare(a.date) || a.ticker.localeCompare(b.ticker),
    );

    function handleSave() {
        onSave(filled.map((p) => ({ date, ticker: p.ticker, priceCents: p.cents as number })));
        setPrices({});
    }

    return (
        <div className="card shadow-sm mb-4">
            <div className="card-header d-flex align-items-center gap-2 flex-wrap">
                <i className="bi bi-tag trap-text-accent"></i>
                <span className="fw-semibold">Koersen</span>
                {eigen.length > 0 && (
                    <span className="badge bg-secondary">{eigen.length} zelf ingevoerd</span>
                )}
            </div>
            <div className="card-body">
                <p className="text-muted small">
                    De koersen van je aankoopdagen komen uit je export. Vul hier de koers van
                    vandaag in, of van een dag waarop je niets kocht, om de grafiek bij te werken.
                </p>

                <div className="row g-2 align-items-end">
                    <div className="col-sm-auto">
                        <label className="form-label small mb-1" htmlFor="koers-datum">
                            Datum
                        </label>
                        <input
                            id="koers-datum"
                            type="date"
                            className="form-control form-control-sm"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    {tickers.map((ticker) => {
                        const laatste = priceAt(quotes, ticker, date);
                        const waarde = prices[ticker] ?? '';
                        return (
                            <div className="col-sm" key={ticker}>
                                <label
                                    className="form-label small mb-1"
                                    htmlFor={`koers-${ticker}`}
                                >
                                    {ticker}
                                </label>
                                <div className="input-group input-group-sm">
                                    <span className="input-group-text">EUR</span>
                                    <input
                                        id={`koers-${ticker}`}
                                        type="text"
                                        inputMode="decimal"
                                        className={`form-control ${parseEuroInput(waarde) === null ? 'is-invalid' : ''}`}
                                        placeholder={
                                            laatste === null
                                                ? '0,00'
                                                : (laatste / 100).toFixed(2).replace('.', ',')
                                        }
                                        value={waarde}
                                        onChange={(e) =>
                                            setPrices({ ...prices, [ticker]: e.target.value })
                                        }
                                    />
                                </div>
                            </div>
                        );
                    })}

                    <div className="col-sm-auto">
                        <button
                            type="button"
                            className="btn btn-sm btn-custom trap-bg-primary"
                            disabled={!canSave}
                            onClick={handleSave}
                        >
                            <i className="bi bi-check-lg me-1"></i>
                            Bewaren
                        </button>
                    </div>
                </div>

                <div className="small mt-2">
                    {invalid && (
                        <span className="text-danger">
                            Vul enkel koersen in, bijvoorbeeld 43,24.
                        </span>
                    )}
                    {!invalid && filled.length === 0 && (
                        <span className="text-muted">
                            De grijze waarden zijn de laatst bekende koers op die datum.
                        </span>
                    )}
                    {!invalid && filled.length > 0 && (
                        <span className="text-success">
                            {filled.length} {filled.length === 1 ? 'koers' : 'koersen'} klaar om te
                            bewaren.
                        </span>
                    )}
                </div>

                {eigen.length > 0 && (
                    <>
                        <hr />
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <span className="small fw-semibold">Zelf ingevoerd</span>
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
                                <tbody>
                                    {eigen.map((q) => (
                                        <tr key={`${q.date}|${q.ticker}`}>
                                            <td className="small">
                                                {formatDate(new Date(q.date))}
                                            </td>
                                            <td>
                                                <span className="badge bg-secondary">
                                                    {q.ticker}
                                                </span>
                                            </td>
                                            <td className="text-end font-monospace small">
                                                {formatEuro(q.priceCents)}
                                            </td>
                                            <td className="text-end" style={{ width: '1%' }}>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-link text-danger p-0"
                                                    aria-label={`Koers van ${q.ticker} op ${q.date} verwijderen`}
                                                    onClick={() => onDelete(q)}
                                                >
                                                    <i className="bi bi-x-lg"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
