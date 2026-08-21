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
import { formatEuro } from '../format';
import type { ValuePoint } from '../models/price';
import { useTheme } from '../useTheme';

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

/** Toont 'mrt 25' onder de as; de volledige datum staat in de tooltip. */
function formatAxisDate(date: string): string {
    const [year, month] = date.split('-');
    const namen = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
    return `${namen[Number(month) - 1]} ${year.slice(2)}`;
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
                <div className="fw-semibold mb-1">{formatAxisDate(point.date)}</div>
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
    const last = series.at(-1);
    const result = last ? last.valueCents - last.investedCents : 0;

    return (
        <div className="card shadow-sm mb-4">
            <div className="card-header d-flex align-items-center gap-2 flex-wrap">
                <i className="bi bi-graph-up trap-text-accent"></i>
                <span className="fw-semibold">Waarde in de tijd</span>
                {last && (
                    <span className="ms-auto small text-muted">
                        {formatAxisDate(last.date)}:{' '}
                        <strong className="trap-text-primary">
                            {formatEuro(last.valueCents)}
                        </strong>{' '}
                        <span className={result >= 0 ? 'text-success' : 'text-danger'}>
                            ({result >= 0 ? '+' : ''}
                            {formatEuro(result)})
                        </span>
                    </span>
                )}
            </div>
            <div className="card-body">
                {/* Hoogte op de container zodat de asnamen er nog bij passen.
                    Een te krappe hoogte knijpt de as eruit en geeft een
                    minuscule schuifbalk binnen de kaart. */}
                <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={series} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
                        {/* Alleen horizontale lijnen, en een hairline: het raster
                            mag helpen lezen, niet meekijken. */}
                        <CartesianGrid stroke={colors.grid} vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickFormatter={formatAxisDate}
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
            </div>
        </div>
    );
}
