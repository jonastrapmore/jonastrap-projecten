import Accordion from 'react-bootstrap/Accordion';
import { FundCard } from '../components/FundCard';
import { StatTiles } from '../components/StatTiles';
import { ownershipConfig } from '../config/verdeling';
import { useDashboard } from './DashboardContext';

/**
 * Alle fondsen op een pagina, elk als uitklapbaar blok.
 *
 * `alwaysOpen` laat er meer dan een tegelijk openstaan: bij vergelijken wil je
 * twee fondsen naast elkaar kunnen zien, niet telkens de vorige zien dichtklappen.
 */
export function FundsPage() {
    const { data, view } = useDashboard();

    if (data.transactions.length === 0) {
        return <p className="text-muted">Nog geen gegevens. Laad een export in bij Update.</p>;
    }

    const costCents = view.positionPerformance.reduce((s, p) => s + p.costCents, 0);
    const valueCents = view.positionPerformance.some((p) => p.valueCents === null)
        ? null
        : view.positionPerformance.reduce((s, p) => s + (p.valueCents ?? 0), 0);

    return (
        <>
            <StatTiles costCents={costCents} valueCents={valueCents} />

            <Accordion alwaysOpen>
                {view.positionPerformance.map((fund) => (
                    <FundCard
                        key={fund.ticker}
                        fund={fund}
                        shares={view.beneficiaryFundPerformance.filter(
                            (s) => s.ticker === fund.ticker,
                        )}
                        beneficiaries={ownershipConfig.beneficiaries}
                        quotes={view.quotes}
                        purchaseCount={
                            view.positions.find((p) => p.ticker === fund.ticker)?.purchaseCount ?? 0
                        }
                    />
                ))}
            </Accordion>
        </>
    );
}
