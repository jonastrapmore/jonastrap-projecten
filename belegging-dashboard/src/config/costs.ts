/**
 * Kosten bij een verkoop.
 *
 * Als regel met een ingangsdatum, net als het tarief van de beurstaks bij
 * aankoop. Tarieven wijzigen, en dan telt het tarief dat gold op het moment
 * van de verrichting; een nieuwe regel toevoegen mag de historiek niet
 * herrekenen.
 *
 * Alles in basispunten: 12 is 0,12 procent. Zo blijft het rekenwerk in hele
 * getallen en hoeft er nergens met een kommagetal vermenigvuldigd te worden.
 */
export type SaleCostRule = {
    /** ISO-datum, inclusief. */
    from: string;
    /** Beurstaks bij verkoop, in basispunten. */
    transactionTaxBasisPoints: number;
    /** Plafond van die taks per verrichting, in hele centen. */
    transactionTaxCapCents: number;
    /**
     * Belasting op de meerwaarde, in basispunten.
     *
     * STAAT BEWUST OP NUL. Dit tarief is nog niet nagekeken, en een verkeerd
     * getal invullen is erger dan geen getal: dan reken je jezelf rijk of arm
     * op een bedrag waar niemand naar gekeken heeft. Het scherm meldt daarom
     * dat er mogelijk nog iets af gaat.
     *
     * Zoek dit op voor er werkelijk verkocht wordt, en zet het hier.
     */
    capitalGainsBasisPoints: number;
};

export const saleCostRules: SaleCostRule[] = [
    {
        from: '2024-01-01',
        transactionTaxBasisPoints: 12,
        transactionTaxCapCents: 130000,
        capitalGainsBasisPoints: 0,
    },
];

/** De regel die op een datum van kracht is, of de laatste als er geen past. */
export function saleCostRuleAt(date: string): SaleCostRule {
    const geldig = saleCostRules
        .filter((r) => r.from <= date)
        .sort((a, b) => a.from.localeCompare(b.from));
    return geldig.at(-1) ?? saleCostRules[0];
}
