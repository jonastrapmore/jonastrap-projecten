import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

function readTheme(): Theme {
    return document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'dark' : 'light';
}

/**
 * Leest het huidige thema uit `data-bs-theme` op het html-element.
 *
 * Nodig omdat een grafiek zijn kleuren als gewone attributen zet, en daar
 * werken CSS-variabelen niet in. De rest van je opmaak schakelt vanzelf mee via
 * CSS; deze kleuren moeten we zelf kiezen.
 *
 * Een eigen functie die met `use` begint, heet in React een hook. De regel is
 * dat je andere hooks (zoals useState en useEffect) alleen bovenin een
 * component of in zo'n eigen hook mag aanroepen, nooit in een lus of een if.
 */
export function useTheme(): Theme {
    const [theme, setTheme] = useState<Theme>(readTheme);

    useEffect(() => {
        // Kijkt of het attribuut wijzigt, zodat een themaknop later vanzelf werkt.
        const observer = new MutationObserver(() => setTheme(readTheme()));
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-bs-theme'],
        });

        // Wat je uit een useEffect teruggeeft, draait React bij het opruimen.
        // Zonder dit blijft de waarnemer draaien nadat het component weg is,
        // en dat is precies hoe je in React geheugen laat weglekken.
        return () => observer.disconnect();
    }, []);

    return theme;
}
