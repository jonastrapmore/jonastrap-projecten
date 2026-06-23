// Resultaat van een vertaling: de tekst plus welke engine ze leverde (voor het "vertaald door"-label)
export interface VertaalResultaat {
    text: string;
    engine: string; // 'Google' | 'MyMemory' | 'Origineel (Engels)'
}

// Gedeelde vertaalhulp. Probeert eerst Google (beste kwaliteit, CORS-vriendelijk),
// daarna MyMemory als fallback. Lukt geen van beide, dan komt de originele tekst terug.
export async function translate(text: string, from = 'en', to = 'nl'): Promise<VertaalResultaat> {
    // Lege tekst niet vertalen
    if (!text || text.trim() === '') {
        return { text, engine: 'Origineel (Engels)' };
    }

    // 1. Google (onofficieel endpoint, maar werkt vanuit de browser)
    try {
        const res = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`,
        );
        if (res.ok) {
            const data = await res.json();
            // data[0] is een lijst segmenten; segment[0] bevat de vertaalde tekst
            const vertaald = data[0].map((segment: [string]) => segment[0]).join('');
            return { text: vertaald, engine: 'Google' };
        }
    } catch {
        // val door naar MyMemory
    }

    // 2. Fallback: MyMemory
    try {
        const res = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`,
        );
        if (res.ok) {
            const data: { responseData: { translatedText: string } } = await res.json();
            return { text: data.responseData.translatedText, engine: 'MyMemory' };
        }
    } catch {
        // beide mislukt
    }

    // 3. Niks lukte: liever de Engelse tekst dan een lege widget
    return { text, engine: 'Origineel (Engels)' };
}
