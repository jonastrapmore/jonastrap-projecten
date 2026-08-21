import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { useState } from 'react';
import { formatDate, formatEuro } from '../format';
import type { ValuePoint } from '../models/price';
import { useTheme } from '../useTheme';
import type { ChartRange } from '../valuation';
import { filterByRange, monthsBetween, today } from '../valuation';
import { RangeTabs } from './RangeTabs';

/**
 * Kleuren voor de twee lijnen, uit een palet dat op contrast en
 * kleurenblindheid gecontroleerd is. Beide thema's zijn apart gekozen: de
 * donkere kolom is niet de lichte omgedraaid, maar dezelfde tinten opnieuw
 * gekozen voor een donkere achtergrond.
 */
const PALETTE = {
    light: { value: '#2a78d6', invested: '#eb6834', grid: '#dcdcd8', text: '#52514e' },
    dark: { value: '#3987e5', invested: '#d95926', grid: '#33333a', text: '#adb5bd' },
};

/**
 * Toont 'mrt 2025' onder de as.
 *
 * Het jaartal staat er voluit bij en niet als 'mrt 25': dat laatste leest als
 * een dagnummer. Een aslabel dat je twee keer moet lezen is fout, ook al is de
 * korte vorm mooier.
 */
function formatAxisMonth(date: string): string {
    const [year, month] = date.split('-');
    const namen = [
        'jan',
        'feb',
        'mrt',
        'apr',
        'mei',
        'jun',
        'jul',
        'aug',
        'sep',
        'okt',
        'nov',
        'dec',
    ];
    return `${namen[Number(month) - 1]} ${year}`;
}

/** Bedragen op de as afgekort tot duizendtallen: 21497,16 wordt "21k". */
function formatAxisEuro(cents: number): string {
    return `${Math.round(cents / 100000)}k`;
}

type TooltipPayload = { payload: ValuePoint };

type ChartTooltipProps = {
    active?: boolean;
    payload?: TooltipPayload[];
};

/**
 * Eigen tooltip in plaats van de standaard, om er het verschil bij te zetten.
 * Dat verschil is waar het om gaat en het staat nergens anders in de grafiek.
 */
function ChartTooltip({ active, payload }: ChartTooltipProps) {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    const point = payload[0].payload;
    const result = point.valueCents - point.investedCents;

    return (
        <div className="card shadow-sm">
            <div className="card-body p-2 small">
                {/* De volledige datum, niet de maand: in een tooltip wil je
                    weten welke dag je aanwijst. */}
                <div className="fw-semibold mb-1">{formatDate(new Date(point.date))}</div>
                <div className="d-flex justify-content-between gap-3">
                    <span className="text-muted">Waarde</span>
                    <span className="font-monospace">{formatEuro(point.valueCents)}</span>
                </div>
                <div className="d-flex justify-content-between gap-3">
                    <span className="text-muted">Ingelegd</span>
                    <span className="font-monospace">{formatEuro(point.investedCents)}</span>
                </div>
                <div className="d-flex justify-content-between gap-3 border-top mt-1 pt-1">
                    <span className="text-muted">Resultaat</span>
                    <span className="font-monospace fw-semibold">
                        {result >= 0 ? '+' : ''}
                        {formatEuro(result)}
                    </span>
                </div>
            </div>
        </div>
    );
}

type ValueChartProps = {
    series: ValuePoint[];
};

/**
 * De waarde van de portefeuille tegenover wat er is ingelegd, over de tijd.
 *
 * Beide reeksen staan in euro, dus ze delen een as. Twee assen met
 * verschillende schalen zouden een verband suggereren dat er niet is.
 */
export function ValueChart({ series }: ValueChartProps) {
    const colors = PALETTE[useTheme()];
    // Elke grafiek houdt zijn eigen tijdvak bij. Zou dat in App staan, dan
    // sprongen alle grafieken tegelijk mee.
    const [range, setRange] = useState<ChartRange>('all');

    const zichtbaar = filterByRange(series, range);
    const eersteDag = series.at(0)?.date;
    const beschikbareMaanden = eersteDag ? monthsBetween(eersteDag, today()) : 0;

    // De kop toont altijd de laatst bekende stand, ook als het gekozen tijdvak
    // leeg is: dat is de vraag "waar sta ik nu", los van wat de grafiek toont.
    const last = series.at(-1);
    const result = last ? last.valueCents - last.investedCents : 0;

    return (
        <div className="card shadow-sm mb-4">
            <div className="card-header d-flex align-items-center gap-2 flex-wrap">
                <i className="bi bi-graph-up trap-text-accent"></i>
                <span className="fw-semibold">Waarde in de tijd</span>
                {last && (
                    <span className="ms-auto small text-muted">
                        {formatDate(new Date(last.date))}:{' '}
                        <strong className="trap-text-primary">{formatEuro(last.valueCents)}</strong>{' '}
                        <span className={result >= 0 ? 'text-success' : 'text-danger'}>
                            ({result >= 0 ? '+' : ''}
                            {formatEuro(result)})
                        </span>
                    </span>
                )}
            </div>
            <div className="card-body">
                <div className="d-flex justify-content-end mb-3">
                    <RangeTabs
                        value={range}
                        onChange={setRange}
                        availableMonths={beschikbareMaanden}
                    />
                </div>

                {zichtbaar.length < 2 && (
                    <p className="text-muted small mb-0">
                        Te weinig meetpunten in dit tijdvak. Voer een koers in bij "Koersen" om hier
                        iets te zien, of kies een langer tijdvak.
                    </p>
                )}

                {/* Hoogte op de container zodat de asnamen er nog bij passen.
                    Een te krappe hoogte knijpt de as eruit en geeft een
                    minuscule schuifbalk binnen de kaart. */}
                {zichtbaar.length >= 2 && (
                    <ResponsiveContainer width="100%" height={320}>
                        <LineChart
                            data={zichtbaar}
                            margin={{ top: 8, right: 16, bottom: 0, left: 8 }}
                        >
                            {/* Alleen horizontale lijnen, en een hairline: het raster
                            mag helpen lezen, niet meekijken. */}
                            <CartesianGrid stroke={colors.grid} vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatAxisMonth}
                                tick={{ fill: colors.text, fontSize: 12 }}
                                stroke={colors.grid}
                                minTickGap={32}
                            />
                            <YAxis
                                tickFormatter={formatAxisEuro}
                                tick={{ fill: colors.text, fontSize: 12 }}
                                stroke={colors.grid}
                                width={44}
                            />
                            <Tooltip content={<ChartTooltip />} cursor={{ stroke: colors.grid }} />
                            <Legend
                                verticalAlign="top"
                                align="right"
                                height={28}
                                wrapperStyle={{ fontSize: 12, color: colors.text }}
                            />
                            {/* Waarde eerst, want dat is de reeks waar het om draait. */}
                            <Line
                                name="Waarde"
                                type="monotone"
                                dataKey="valueCents"
                                stroke={colors.value}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4 }}
                            />
                            <Line
                                name="Ingelegd"
                                type="monotone"
                                dataKey="investedCents"
                                stroke={colors.invested}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
