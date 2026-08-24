import { funds } from './config/fondsen';
import type { Fund } from './models/fund';

/**
 * Zoekt een fonds op zijn ticker.
 *
 * Geeft undefined bij een onbekende ticker. Dat gebeurt als je een fonds koopt
 * en vergeet het aan de configuratie toe te voegen; het scherm valt dan terug
 * op de ticker zelf in plaats van te crashen.
 */
export function findFund(ticker: string): Fund | undefined {
    return funds.find((f) => f.ticker === ticker);
}

/** De korte naam, of de ticker als het fonds niet in de configuratie staat. */
export function fundLabel(ticker: string): string {
    return findFund(ticker)?.label ?? ticker;
}

/** De volledige naam, voor een tooltip. Leeg als het fonds onbekend is. */
export function fundFullName(ticker: string): string {
    return findFund(ticker)?.fullName ?? '';
}

/**
 * Een vaste kleur per fonds, voor het bolletje naast de naam.
 *
 * De kleur volgt de plaats in de configuratie, niet de omvang of het
 * rendement. Zo houdt een fonds dezelfde kleur als de volgorde in een tabel
 * verandert: kleur hoort bij wat iets is, niet bij waar het toevallig staat.
 *
 * De tinten komen uit een palet dat op contrast en kleurenblindheid
 * gecontroleerd is; de eerste drie slaan in beide thema's op elk paar. Zijn er
 * ooit meer dan acht fondsen, dan is er geen negende kleur en herhaalt hij:
 * een bijverzonnen tint is onder kleurenblindheid niet meer te scheiden.
 */
const FUND_COLORS = {
    light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'],
    dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
};

export function fundColor(ticker: string, theme: 'light' | 'dark'): string {
    const index = funds.findIndex((f) => f.ticker === ticker);
    const reeks = FUND_COLORS[theme];
    return reeks[(index < 0 ? 0 : index) % reeks.length];
}
