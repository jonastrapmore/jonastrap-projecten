import type { ChartRange } from '../valuation';
import { RANGES } from '../valuation';

type RangeTabsProps = {
    value: ChartRange;
    onChange: (range: ChartRange) => void;
    /**
     * Hoeveel maanden historiek er is. Tijdvakken die verder teruggaan worden
     * verborgen: op een tabblad klikken waar niets verandert, leest als een
     * defect. Zodra er meer historiek is, verschijnt het vanzelf.
     */
    availableMonths: number;
};

export function RangeTabs({ value, onChange, availableMonths }: RangeTabsProps) {
    const zichtbaar = RANGES.filter((r) => r.months === null || r.months <= availableMonths);

    // Met alleen "Altijd" over valt er niets te kiezen; dan is de balk ruis.
    if (zichtbaar.length < 2) {
        return null;
    }

    return (
        <div className="btn-group btn-group-sm" role="group" aria-label="Tijdvak">
            {zichtbaar.map((r) => (
                <button
                    key={r.id}
                    type="button"
                    className={`btn btn-outline-secondary ${r.id === value ? 'active' : ''}`}
                    aria-pressed={r.id === value}
                    onClick={() => onChange(r.id)}
                >
                    {r.label}
                </button>
            ))}
        </div>
    );
}
