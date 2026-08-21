import type { Allocation, OwnershipConfig } from './models/ownership';
import type { Transaction } from './models/transaction';

/** Telt de inleg van alle begunstigden in een verdeling bij elkaar op. */
function sumCents(contributions: Record<string, number>): number {
    return Object.values(contributions).reduce((total, cents) => total + cents, 0);
}

/**
 * Zoekt op wie er bij deze aankoop hoeveel inlegde.
 *
 * Eerst wordt gekeken of er een uitzondering bestaat voor deze datum en dit
 * fonds. Zo niet, dan geldt de vaste regel die op die datum van kracht was.
 */
function findContributions(
    date: string,
    ticker: string,
    amountCents: number,
    config: OwnershipConfig,
): Record<string, number> {
    const override = config.overrides.find((o) => o.date === date && o.ticker === ticker);

    if (override) {
        // Een uitzondering noemt exacte bedragen. Die moeten samen precies het
        // aankoopbedrag zijn, anders loopt de configuratie uit de pas met de export.
        const total = sumCents(override.contributions);
        if (total !== amountCents) {
            throw new Error(
                `Uitzondering ${date} ${ticker}: de inleg telt op tot ${total} cent, ` +
                    `maar de aankoop was ${amountCents} cent.`,
            );
        }
        return override.contributions;
    }

    // Van alle regels voor dit fonds die op deze datum al golden, nemen we de
    // meest recente. Zo vervangt een nieuwe regel de vorige vanzelf en houden
    // oudere transacties hun eigen regel: de historiek blijft kloppen.
    const rule = config.rules
        .filter((r) => r.ticker === ticker && r.from <= date)
        .sort((a, b) => a.from.localeCompare(b.from))
        .at(-1);

    if (!rule) {
        throw new Error(
            `Geen inlegregel gevonden voor ${ticker} op ${date}. ` +
                `Voeg een regel of een uitzondering toe aan de configuratie.`,
        );
    }

    const expected = sumCents(rule.contributions);
    if (expected === amountCents) {
        return rule.contributions;
    }

    // Het bedrag wijkt af van de regel. Staat er maar een begunstigde in, dan
    // valt er niets te verdelen en gaat alles naar die persoon. Dat vangt
    // bijvoorbeeld een jaarlijkse storting op die samen met de maandinleg in
    // een enkele order is uitgevoerd.
    const payers = Object.entries(rule.contributions).filter(([, cents]) => cents > 0);
    if (payers.length === 1) {
        return { [payers[0][0]]: amountCents };
    }

    // Gedeeld fonds en een onverwacht bedrag: hier gokken we niet. De verhouding
    // van de regel toepassen zou geld aan de verkeerde persoon toekennen zonder
    // dat iets je waarschuwt.
    throw new Error(
        `Aankoop van ${amountCents} cent in ${ticker} op ${date} wijkt af van de regel ` +
            `(${expected} cent) en het fonds is gedeeld. Voeg een uitzondering toe.`,
    );
}

/**
 * Verdeelt een aankoop over de begunstigden: wie een derde van het bedrag
 * inlegde, krijgt een derde van de aandelen uit die transactie.
 *
 * Stortingen horen hier niet, die zijn geen bezit. De aanroeper filtert ze eruit.
 */
export function allocate(transaction: Transaction, config: OwnershipConfig): Allocation[] {
    // Uitpakken naar losse const's. Binnen de forEach onderaan zou TypeScript
    // de null-controle op transaction.quantityE8 anders weer loslaten, omdat
    // een veld van een object in theorie tussendoor kan wijzigen.
    const { ticker, quantityE8, amountCents } = transaction;

    if (transaction.type !== 'BUY') {
        throw new Error(`Alleen aankopen kunnen verdeeld worden: ${transaction.id}`);
    }
    if (ticker === null || quantityE8 === null) {
        throw new Error(`Aankoop zonder ticker of aantal: ${transaction.id}`);
    }

    const date = transaction.timestampRaw.slice(0, 10);
    const contributions = findContributions(date, ticker, amountCents, config);

    // Vaste volgorde uit de configuratie, zodat de uitkomst niet afhangt van de
    // volgorde waarin de sleutels toevallig in het object staan. Wie niets
    // inlegde, krijgt geen regel.
    const ids = config.beneficiaries
        .map((b) => b.id)
        .filter((id) => (contributions[id] ?? 0) > 0);

    // Vangt een typfout in de configuratie: staat er een begunstigde in die
    // niet in `beneficiaries` voorkomt, dan valt zijn inleg hierboven weg en
    // klopt dit totaal niet meer.
    const allocatedCents = ids.reduce((total, id) => total + contributions[id], 0);
    if (allocatedCents !== amountCents) {
        throw new Error(
            `Verdeling van ${date} ${ticker} dekt ${allocatedCents} van ${amountCents} cent. ` +
                `Staat er een onbekende begunstigde in de configuratie?`,
        );
    }

    const allocations: Allocation[] = [];
    let remaining = quantityE8;

    ids.forEach((id, index) => {
        const costCents = contributions[id];
        const isLast = index === ids.length - 1;

        // Iedereen behalve de laatste wordt afgerond, de laatste krijgt wat er
        // overblijft. Zo tellen de delen altijd exact op tot het aantal aandelen
        // dat werkelijk gekocht is, zonder dat er een tienmiljoenste zoekraakt.
        const share = isLast ? remaining : Math.round((quantityE8 * costCents) / amountCents);
        remaining -= share;

        allocations.push({ beneficiary: id, costCents, quantityE8: share });
    });

    return allocations;
}
