import { saleCostRuleAt } from './config/costs';
import type { PriceQuote } from './models/price';
import type { BeneficiaryPosition, Position } from './models/position';
import { priceAt, today } from './valuation';

/**
 * Wat een positie waard is en wat dat opleverde.
 *
 * `valueCents` is null als er voor dat fonds nog geen koers bekend is. Dan is
 * er niets te tonen, en dat is iets anders dan een waarde van nul.
 */
export type PositionPerformance = {
    ticker: string;
    quantityE8: number;
    costCents: number;
    valueCents: number | null;
    gainCents: number | null;
};

/** Hetzelfde per begunstigde, met wat er na verkoopkosten overblijft. */
export type BeneficiaryPerformance = {
    beneficiary: string;
    costCents: number;
    valueCents: number | null;
    gainCents: number | null;
    /** Beurstaks bij verkoop. */
    saleTaxCents: number | null;
    /** Belasting op de meerwaarde. Nul zolang dat tarief niet ingevuld is. */
    capitalGainsTaxCents: number | null;
    /** Wat er na die kosten overblijft. */
    netCents: number | null;
};

/** Waarde van een aantal aandelen tegen een koers, allebei geschaald. */
function valueOf(quantityE8: number, priceCents: number): number {
    return Math.round((quantityE8 * priceCents) / 1e8);
}

export function buildPositionPerformance(
    positions: Position[],
    quotes: PriceQuote[],
    date: string = today(),
): PositionPerformance[] {
    return positions.map((p) => {
        const price = priceAt(quotes, p.ticker, date);
        const valueCents = price === null ? null : valueOf(p.quantityE8, price);

        return {
            ticker: p.ticker,
            quantityE8: p.quantityE8,
            costCents: p.costCents,
            valueCents,
            gainCents: valueCents === null ? null : valueCents - p.costCents,
        };
    });
}

/**
 * Telt de posities per persoon op en rekent uit wat er na verkoop overblijft.
 *
 * De kosten worden berekend over het geheel van die persoon, niet per fonds.
 * Dat klopt niet helemaal met de werkelijkheid, want de beurstaks geldt per
 * verrichting en verkopen doe je per fonds. Zolang het plafond nergens in beeld
 * komt maakt dat niets uit; komt er ooit een verkoop van meer dan een miljoen,
 * dan moet dit per fonds.
 */
export function buildBeneficiaryPerformance(
    positions: BeneficiaryPosition[],
    quotes: PriceQuote[],
    date: string = today(),
): BeneficiaryPerformance[] {
    const rule = saleCostRuleAt(date);
    const byBeneficiary = new Map<string, BeneficiaryPerformance>();

    for (const p of positions) {
        const entry = byBeneficiary.get(p.beneficiary) ?? {
            beneficiary: p.beneficiary,
            costCents: 0,
            valueCents: 0 as number | null,
            gainCents: null,
            saleTaxCents: null,
            capitalGainsTaxCents: null,
            netCents: null,
        };

        entry.costCents += p.costCents;

        const price = priceAt(quotes, p.ticker, date);
        if (price === null) {
            // Een onbekende koers maakt het totaal onbekend: doen alsof dat
            // fonds nul waard is, zou een te laag bedrag opleveren dat er wel
            // betrouwbaar uitziet.
            entry.valueCents = null;
        } else if (entry.valueCents !== null) {
            entry.valueCents += valueOf(p.quantityE8, price);
        }

        byBeneficiary.set(p.beneficiary, entry);
    }

    for (const entry of byBeneficiary.values()) {
        if (entry.valueCents === null) {
            continue;
        }

        entry.gainCents = entry.valueCents - entry.costCents;

        entry.saleTaxCents = Math.min(
            Math.round((entry.valueCents * rule.transactionTaxBasisPoints) / 10000),
            rule.transactionTaxCapCents,
        );

        // Alleen over winst. Bij verlies valt er niets te belasten, en een
        // negatieve belasting bestaat niet.
        entry.capitalGainsTaxCents =
            entry.gainCents > 0
                ? Math.round((entry.gainCents * rule.capitalGainsBasisPoints) / 10000)
                : 0;

        entry.netCents = entry.valueCents - entry.saleTaxCents - entry.capitalGainsTaxCents;
    }

    return [...byBeneficiary.values()].sort((a, b) => a.beneficiary.localeCompare(b.beneficiary));
}

/** Wat een persoon in een bepaald fonds bezit, met wat het waard is. */
export type BeneficiaryFundPerformance = {
    beneficiary: string;
    ticker: string;
    quantityE8: number;
    costCents: number;
    valueCents: number | null;
    gainCents: number | null;
};

/**
 * Zelfde als buildPositionPerformance, maar dan uitgesplitst per persoon.
 *
 * Nodig voor het fondsen-tabblad: daar wil je per fonds zien wie welk deel
 * ervan bezit en wat dat deel waard is.
 */
export function buildBeneficiaryFundPerformance(
    positions: BeneficiaryPosition[],
    quotes: PriceQuote[],
    date: string = today(),
): BeneficiaryFundPerformance[] {
    return positions.map((p) => {
        const price = priceAt(quotes, p.ticker, date);
        const valueCents = price === null ? null : valueOf(p.quantityE8, price);

        return {
            beneficiary: p.beneficiary,
            ticker: p.ticker,
            quantityE8: p.quantityE8,
            costCents: p.costCents,
            valueCents,
            gainCents: valueCents === null ? null : valueCents - p.costCents,
        };
    });
}
