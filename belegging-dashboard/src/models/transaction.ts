// Het interne formaat waarin elke broker-parser zijn rijen aflevert.
// Bewust brokeronafhankelijk: de Revolut-specifieke namen worden in
// de parser naar dit formaat vertaald.

export type TransactionType = 'BUY' | 'SELL' | 'DEPOSIT';

// prettier-ignore
export interface Transaction {
    id: string                          // dedup: tijdstip + ticker + type + bedrag
    timestampRaw: string                // ruwe tekst uit de export, met microseconden
    timestamp: Date                     // afgeleid, om te sorteren en filteren
    broker: string                      // mee geven van welke broker het komt
    ticker: string | null               // verkorte code van de ETF - indien niet aanwezig moet hij null zijn
    type: TransactionType               // type van de transactie
    quantityE8: number | null           // de hoeveelheid gaan * 100000000 doen als geheel getal
    pricePerShareCents: number | null   // Eur verwijderd en in centen omgezet
    amountCents: number                 // omvormen naar cents
    currency: string                    // rechtstreeks overnemen
    fxRate: number                      // wisselkoers
}
