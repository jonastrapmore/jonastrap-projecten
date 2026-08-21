export type Position = {
    ticker: string;
    quantityE8: number; // totaal aantal aandelen, geschaald
    costCents: number; // totaal betaald
    purchaseCount: number;
};

/**
 * Een positie van een enkele begunstigde in een enkel fonds. Wordt herberekend
 * uit de transacties en de inlegregels; nergens opgeslagen.
 */
export type BeneficiaryPosition = {
    beneficiary: string;
    ticker: string;
    quantityE8: number; // aandeel in het totaal, geschaald
    costCents: number; // wat deze persoon voor dit fonds inlegde
    purchaseCount: number;
};
