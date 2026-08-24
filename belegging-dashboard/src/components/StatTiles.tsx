import { formatEuro } from '../format';

type StatTilesProps = {
    costCents: number;
    valueCents: number | null;
};

/**
 * De vier kopgetallen: ingelegd, waarde, winst en rendement.
 *
 * Bewust geen grafiek. Dit beantwoordt "waar sta ik nu", en dat is een getal.
 * Een grafiek van een enkele stand is een lijn van een punt.
 */
export function StatTiles({ costCents, valueCents }: StatTilesProps) {
    const gainCents = valueCents === null ? null : valueCents - costCents;
    const positief = gainCents !== null && gainCents >= 0;

    // Groen en rood mogen hier: dit is echt goed of slecht nieuws, geen
    // identiteit. Voor reeksen in een grafiek zou dat niet mogen.
    const kleur = gainCents === null ? '' : positief ? 'text-success' : 'text-danger';

    const tegels = [
        { label: 'Ingelegd', waarde: formatEuro(costCents), klasse: '' },
        {
            label: 'Waarde nu',
            waarde: valueCents === null ? 'geen koers' : formatEuro(valueCents),
            klasse: '',
        },
        {
            label: 'Winst',
            waarde: gainCents === null ? '-' : `${positief ? '+' : ''}${formatEuro(gainCents)}`,
            klasse: kleur,
        },
        {
            label: 'Rendement',
            waarde:
                gainCents === null || costCents === 0
                    ? '-'
                    : `${positief ? '+' : ''}${((gainCents / costCents) * 100).toFixed(1)} %`,
            klasse: kleur,
        },
    ];

    return (
        <div className="row g-3 mb-4">
            {tegels.map((t) => (
                <div className="col-6 col-lg-3" key={t.label}>
                    <div className="card shadow-sm h-100">
                        <div className="card-body">
                            <div className="text-muted small text-uppercase ls-1">{t.label}</div>
                            <div className={`fs-4 fw-semibold font-monospace ${t.klasse}`}>
                                {t.waarde}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
