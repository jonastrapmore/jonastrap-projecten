import type { Transaction, TransactionType } from '../models/transaction'
import { parseScaled } from './scaledInt'

// De kopregel zoals Revolut hem levert. Wijkt de export hiervan af,
// dan stoppen we: kolommen kunnen verschoven zijn.
const EXPECTED_HEADER =
    'Date,Ticker,Type,Quantity,Price per share,Total Amount,Currency,FX Rate'

// Revolut-specifieke typenamen naar het interne formaat.
// Het type is bewust `| undefined`, zodat TypeScript ons dwingt
// het geval "niet gevonden" af te handelen.
const TYPE_MAP: Record<string, TransactionType | undefined> = {
    'BUY - MARKET': 'BUY',
    'CASH TOP-UP': 'DEPOSIT',
}

const BROKER = 'revolut'

/**
 * Leest een Revolut-CSV-export in en zet elke rij om naar het interne
 * transactieformaat. Filtert niets weg: ook stortingen komen terug.
 * Wat er niet herkend wordt, gooit een fout.
 */
export function parseRevolutCsv(csv: string): Transaction[] {
    const lines = csv.trim().split(/\r?\n/)

    if (lines[0] !== EXPECTED_HEADER) {
        throw new Error(
            `Onverwachte kopregel in de Revolut-export.\n` +
                `Verwacht: ${EXPECTED_HEADER}\n` +
                `Gekregen: ${lines[0]}`,
        )
    }

    // +2 omdat de kopregel regel 1 is en index bij 0 begint:
    // zo verwijzen foutmeldingen naar het regelnummer in je bestand.
    return lines.slice(1).map((line, index) => parseLine(line, index + 2))
}

/** Zet een enkele datarij om. Het regelnummer dient alleen voor foutmeldingen. */
function parseLine(line: string, lineNumber: number): Transaction {
    const columns = line.split(',')

    if (columns.length !== 8) {
        throw new Error(
            `Regel ${lineNumber}: 8 kolommen verwacht, ${columns.length} gekregen.`,
        )
    }

    const [rawDate, rawTicker, rawType, rawQuantity, rawPrice, rawAmount, currency, rawFxRate] =
        columns

    const type = TYPE_MAP[rawType]
    if (type === undefined) {
        throw new Error(`Regel ${lineNumber}: onbekend transactietype '${rawType}'.`)
    }

    const timestamp = new Date(rawDate)
    if (Number.isNaN(timestamp.getTime())) {
        throw new Error(`Regel ${lineNumber}: ongeldig tijdstip '${rawDate}'.`)
    }

    const fxRate = Number(rawFxRate)
    if (Number.isNaN(fxRate)) {
        throw new Error(`Regel ${lineNumber}: ongeldige FX-koers '${rawFxRate}'.`)
    }

    return {
        id: [rawDate, rawTicker, rawType, rawAmount].join('|'),
        timestampRaw: rawDate,
        timestamp,
        broker: BROKER,
        type,
        ticker: rawTicker || null,
        quantityE8: rawQuantity ? parseScaled(rawQuantity, 8) : null,
        pricePerShareCents: rawPrice
            ? parseMoneyCents(rawPrice, lineNumber, currency)
            : null,
        amountCents: parseMoneyCents(rawAmount, lineNumber, currency),
        currency,
        fxRate,
    }
}

/**
 * Zet een bedrag met muntprefix ('EUR 6332.07') om naar centen.
 * Controleert meteen of de munt overeenkomt met de Currency-kolom.
 */
function parseMoneyCents(
    value: string,
    lineNumber: number,
    expectedCurrency: string,
): number {
    const [currency, amount] = value.split(' ')

    if (amount === undefined) {
        throw new Error(`Regel ${lineNumber}: bedrag '${value}' heeft geen muntprefix.`)
    }
    if (currency !== expectedCurrency) {
        throw new Error(
            `Regel ${lineNumber}: bedrag staat in ${currency}, maar de Currency-kolom zegt ${expectedCurrency}.`,
        )
    }

    return parseScaled(amount, 2)
}