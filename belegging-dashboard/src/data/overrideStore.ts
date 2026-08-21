import type { ContributionOverride } from '../models/ownership';

/**
 * Opslag voor uitzonderingen op de inlegregels.
 *
 * Bewust gescheiden van het configbestand. Wat in `src/config/verdeling.ts`
 * staat is je vaste basis, die je kunt back-uppen en in een editor nakijken.
 * Wat je onderweg in het scherm invult komt hier terecht, zodat je daarvoor
 * geen code hoeft aan te raken.
 *
 * Bij een botsing wint de opgeslagen versie: die heb je het laatst ingevuld.
 */
export interface OverrideStore {
    load(): Promise<ContributionOverride[]>;
    save(overrides: ContributionOverride[]): Promise<void>;
    clear(): Promise<void>;
}
