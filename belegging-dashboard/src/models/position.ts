export type Position = {
    ticker: string;
    quantityE8: number; // totaal aantal aandelen, geschaald
    costCents: number; // totaal betaald
    purchaseCount: number;
};
