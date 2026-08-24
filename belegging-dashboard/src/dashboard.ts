import { buildBeneficiaryLedger, buildPositions } from './ledger';
import type {
    ContributionOverride,
    OwnershipConfig,
    UnallocatedPurchase,
} from './models/ownership';
import type { PriceQuote, ValuePoint } from './models/price';
import type { BeneficiaryPosition, Position } from './models/position';
import type { Transaction } from './models/transaction';
import {
    buildBeneficiaryFundPerformance,
    buildBeneficiaryPerformance,
    buildPositionPerformance,
} from './performance';
import type {
    BeneficiaryFundPerformance,
    BeneficiaryPerformance,
    PositionPerformance,
} from './performance';
import { buildValueSeries, mergeQuotes, quotesFromTransactions } from './valuation';

/** Alles wat het scherm nodig heeft, afgeleid uit de opgeslagen gegevens. */
export type Dashboard = {
    positions: Position[];
    beneficiaryPositions: BeneficiaryPosition[];
    /** Aankopen die op geen enkele inlegregel passen en nog toegewezen moeten worden. */
    unallocated: UnallocatedPurchase[];
    /** Alleen gevuld bij echt kapotte gegevens, niet bij een ontbrekende regel. */
    ownershipError: string | null;
    /** Koersen uit de aankopen, aangevuld met de handmatig ingevoerde. */
    quotes: PriceQuote[];
    valueSeries: ValuePoint[];
    /** Waarde en resultaat per fonds, tegen de laatst bekende koers. */
    positionPerformance: PositionPerformance[];
    /** Hetzelfde per persoon, met wat er na verkoopkosten overblijft. */
    beneficiaryPerformance: BeneficiaryPerformance[];
    /** Waarde en resultaat per persoon per fonds. */
    beneficiaryFundPerformance: BeneficiaryFundPerformance[];
    firstTransaction: Transaction | undefined;
    lastTransaction: Transaction | undefined;
};

/**
 * Rekent alles uit wat uit de opgeslagen gegevens volgt.
 *
 * Bewust een gewone functie en geen hook: er zit geen state in en niets wordt
 * bewaard. Dat betekent ook dat je hem zonder browser kunt draaien om te
 * controleren of de cijfers kloppen, en bij een dashboard waar een
 * belastingaangifte uit rolt is dat het verschil tussen nakijken en hopen.
 *
 * Draait bij elke hertekening opnieuw. Dat mag: gemeten op een historiek van
 * 26 jaar kost het onder de milliseconde.
 */
export function deriveDashboard(
    transactions: Transaction[],
    overrides: ContributionOverride[],
    manualQuotes: PriceQuote[],
    config: OwnershipConfig,
): Dashboard {
    // Opgeslagen uitzonderingen komen eerst: allocate pakt de eerste die past,
    // dus wat in het scherm is ingevuld wint van wat in het configbestand staat.
    const effectiveConfig: OwnershipConfig = {
        ...config,
        overrides: [...overrides, ...config.overrides],
    };

    let beneficiaryPositions: BeneficiaryPosition[] = [];
    let unallocated: UnallocatedPurchase[] = [];
    let ownershipError: string | null = null;

    try {
        const ledger = buildBeneficiaryLedger(transactions, effectiveConfig);
        beneficiaryPositions = ledger.positions;
        unallocated = ledger.unallocated;
    } catch (e) {
        ownershipError = e instanceof Error ? e.message : String(e);
    }

    const quotes = mergeQuotes(quotesFromTransactions(transactions), manualQuotes);

    const positions = buildPositions(transactions);

    return {
        positions,
        beneficiaryPositions,
        unallocated,
        ownershipError,
        quotes,
        valueSeries: buildValueSeries(transactions, quotes),
        positionPerformance: buildPositionPerformance(positions, quotes),
        beneficiaryPerformance: buildBeneficiaryPerformance(beneficiaryPositions, quotes),
        beneficiaryFundPerformance: buildBeneficiaryFundPerformance(beneficiaryPositions, quotes),
        firstTransaction: transactions.at(0),
        lastTransaction: transactions.at(-1),
    };
}
