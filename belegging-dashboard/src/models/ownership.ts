import type { BeneficiaryPosition } from './position';
import type { Transaction } from './transaction';

// Types voor de eigendomsverdeling. De werkelijke bedragen staan in
// src/config/verdeling.ts, dat niet gecommit wordt. Zie verdeling.example.ts.

/** Sleutel van een begunstigde. Vrije tekst, zodat er later iemand bij kan. */
export type BeneficiaryId = string;

export type Beneficiary = {
    id: BeneficiaryId;
    /** Naam zoals hij op het scherm komt. */
    label: string;
};

/**
 * Vaste inlegregel: geldt vanaf `from` voor elke aankoop van dit fonds,
 * tot een latere regel voor hetzelfde fonds hem vervangt.
 *
 * De bedragen staan in hele centen en vormen samen het verwachte
 * aankoopbedrag. Wijkt een transactie daarvan af, dan geldt:
 *   - een fonds met een begunstigde: alles naar die persoon
 *   - een gedeeld fonds: er moet een override zijn, anders volgt een fout
 */
export type ContributionRule = {
    /** ISO-datum, inclusief: de regel geldt vanaf deze dag. */
    from: string;
    ticker: string;
    /** Inleg per begunstigde, in hele centen. */
    contributions: Record<BeneficiaryId, number>;
};

/**
 * Aankoop die buiten het maandritme valt en zijn eigen verdeling heeft.
 * Wordt herkend op datum en fonds samen; die combinatie moet precies een
 * transactie aanwijzen.
 */
export type ContributionOverride = {
    /** ISO-datum van de aankoop. */
    date: string;
    ticker: string;
    /** Inleg per begunstigde, in hele centen. Moet optellen tot het aankoopbedrag. */
    contributions: Record<BeneficiaryId, number>;
};

export type OwnershipConfig = {
    beneficiaries: Beneficiary[];
    rules: ContributionRule[];
    overrides: ContributionOverride[];
};

/** Wat een transactie oplevert voor een begunstigde. */
export type Allocation = {
    beneficiary: BeneficiaryId;
    /** Deel van het aankoopbedrag, in hele centen. */
    costCents: number;
    /** Deel van de aandelen, geschaald met 8 decimalen. */
    quantityE8: number;
};

/** Een aankoop die op geen enkele regel of uitzondering past. */
export type UnallocatedPurchase = {
    transaction: Transaction;
    /**
     * Het fonds, altijd gevuld. Staat hier apart omdat `transaction.ticker`
     * volgens het type null kan zijn: het ledger heeft dat al gecontroleerd en
     * geeft de gecontroleerde waarde mee, zodat niemand verderop een
     * uitroepteken nodig heeft.
     */
    ticker: string;
    /** ISO-datum van de aankoop, klaar om als sleutel van een uitzondering te dienen. */
    date: string;
    /** De melding uit allocate, zodat het scherm kan tonen wat er ontbreekt. */
    reason: string;
};

/**
 * Wat het ledger teruggeeft: de verdeling die gelukt is, plus de aankopen
 * waarvoor nog een verdeling ingevuld moet worden.
 *
 * Bewust geen fout bij de eerste aankoop die niet past. Zijn er drie, dan wil
 * je ze alle drie zien en in een keer kunnen toewijzen.
 */
export type BeneficiaryLedger = {
    positions: BeneficiaryPosition[];
    unallocated: UnallocatedPurchase[];
};
