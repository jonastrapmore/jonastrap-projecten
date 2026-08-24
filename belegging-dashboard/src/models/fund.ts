/**
 * Wat we van een fonds weten buiten de transacties om.
 *
 * De broker-export bevat alleen de ticker, en die zegt niets: "84X0" is geen
 * afkorting maar een beurscode. De ISIN staat er niet in, terwijl de beurstaks
 * daar juist per compartiment op werkt. Beide horen dus in configuratie.
 */
export type Fund = {
    /** Zoals hij in de broker-export staat. */
    ticker: string;
    /** Internationale code van twaalf tekens, uniek per compartiment. */
    isin: string;
    /** Korte naam voor tabellen en labels. Moet in een kolomkop passen. */
    label: string;
    /** Volledige fondsnaam, voor tooltips en detailschermen. */
    fullName: string;
};
