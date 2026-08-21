// VOORBEELDCONFIGURATIE met verzonnen waarden.
//
// Kopieer dit bestand naar `verdeling.ts` in dezelfde map en vul je eigen
// gegevens in. Dat bestand wordt niet gecommit: het bevat wie hoeveel inlegt,
// en dat hoort niet in een publieke repo.
//
//     cp src/config/verdeling.example.ts src/config/verdeling.ts
//
// Alle bedragen staan in HELE CENTEN. 200 euro is dus 20000.

import type { OwnershipConfig } from '../models/ownership';

export const ownershipConfig: OwnershipConfig = {
    beneficiaries: [
        { id: 'persoon-a', label: 'Persoon A' },
        { id: 'persoon-b', label: 'Persoon B' },
    ],

    // Vaste regels: gelden vanaf `from` voor elke aankoop van dat fonds.
    // Een latere regel voor hetzelfde fonds vervangt de vorige.
    rules: [
        {
            from: '2025-01-01',
            ticker: 'AAAA',
            contributions: { 'persoon-a': 20000, 'persoon-b': 10000 },
        },
        {
            from: '2026-01-01',
            ticker: 'BBBB',
            contributions: { 'persoon-a': 15000, 'persoon-b': 0 },
        },
    ],

    // Aankopen buiten het maandritme, met hun eigen verdeling.
    // De bedragen moeten optellen tot het bedrag van die aankoop.
    overrides: [
        {
            date: '2024-12-01',
            ticker: 'AAAA',
            contributions: { 'persoon-a': 0, 'persoon-b': 500000 },
        },
        {
            date: '2025-06-15',
            ticker: 'AAAA',
            contributions: { 'persoon-a': 123456, 'persoon-b': 0 },
        },
    ],
};
