import { ContributionSummary } from '../components/ContributionSummary';
import { FundPerformance } from '../components/FundPerformance';
import { PayoutSummary } from '../components/PayoutSummary';
import { StatTiles } from '../components/StatTiles';
import { ValueChart } from '../components/ValueChart';
import { ownershipConfig } from '../config/verdeling';
import { useDashboard } from './DashboardContext';

/**
 * De laatste stand.
 *
 * Eerst de vier kopgetallen, dan de uitsplitsing per persoon en per fonds, en
 * pas onderaan het verloop. Dit tabblad beantwoordt "waar sta ik nu", en dat is
 * een getal en geen grafiek; de grafiek staat eronder voor wie ook wil zien hoe
 * dat getal tot stand kwam.
 */
export function OverviewPage() {
    const { data, view } = useDashboard();

    if (data.transactions.length === 0) {
        return <p className="text-muted">Nog geen gegevens. Laad een export in bij Update.</p>;
    }

    const costCents = view.positionPerformance.reduce((s, p) => s + p.costCents, 0);
    // Ontbreekt er een koers, dan is het totaal onbekend en niet te laag.
    const valueCents = view.positionPerformance.some((p) => p.valueCents === null)
        ? null
        : view.positionPerformance.reduce((s, p) => s + (p.valueCents ?? 0), 0);

    return (
        <>
            <StatTiles costCents={costCents} valueCents={valueCents} />

            <PayoutSummary
                performance={view.beneficiaryPerformance}
                beneficiaries={ownershipConfig.beneficiaries}
            />

            <FundPerformance performance={view.positionPerformance} />

            {view.beneficiaryPositions.length > 0 && (
                <ContributionSummary
                    positions={view.beneficiaryPositions}
                    beneficiaries={ownershipConfig.beneficiaries}
                />
            )}

            {/* De cijfers eerst, het verloop onderaan: dit tabblad gaat over
                waar je staat, niet over hoe je er kwam. */}
            {view.valueSeries.length > 1 && <ValueChart series={view.valueSeries} />}
        </>
    );
}
