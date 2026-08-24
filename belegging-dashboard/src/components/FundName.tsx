import { fundFullName, fundLabel } from '../funds';

type FundNameProps = {
    ticker: string;
    /** Zet de ticker eronder. Uit in smalle plekken zoals een formulierlabel. */
    showTicker?: boolean;
};

/**
 * Toont de leesbare naam van een fonds, met de ticker eronder.
 *
 * De ticker blijft zichtbaar omdat dat is wat je bij je broker ziet: zonder
 * die brug moet je twee namen voor hetzelfde fonds onthouden. De volledige
 * naam zit in de tooltip, want die past nergens in een tabel.
 */
export function FundName({ ticker, showTicker = true }: FundNameProps) {
    const label = fundLabel(ticker);
    const full = fundFullName(ticker);

    return (
        <span title={full || undefined}>
            {label}
            {showTicker && label !== ticker && (
                <span className="d-block text-muted small font-monospace">{ticker}</span>
            )}
        </span>
    );
}
