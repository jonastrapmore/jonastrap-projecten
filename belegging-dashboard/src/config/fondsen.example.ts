// VOORBEELDCONFIGURATIE met verzonnen fondsen.
//
// Kopieer dit bestand naar `fondsen.ts` in dezelfde map en vul je eigen
// fondsen in. Dat bestand wordt niet gecommit: welke fondsen je bezit zijn
// je posities, en die horen niet in een publieke repo.
//
//     cp src/config/fondsen.example.ts src/config/fondsen.ts

import type { Fund } from '../models/fund';

export const funds: Fund[] = [
    {
        ticker: 'AAAA',
        isin: 'IE00XXXXXXXX',
        label: 'Wereldwijd',
        fullName: 'Voorbeeldfonds Wereldwijd UCITS ETF (Acc)',
    },
    {
        ticker: 'BBBB',
        isin: 'IE00YYYYYYYY',
        label: 'Obligaties',
        fullName: 'Voorbeeldfonds Obligaties UCITS ETF (Acc)',
    },
];
