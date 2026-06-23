/// <reference types="vite/client" />
import { translate } from '../../effects/translate.ts';
import { CustomElement } from '../../router/customElement.ts';
import HTML from './nasaWidget.html?raw';

// Vorm van het antwoord van de NASA APOD-API (Astronomy Picture of the Day)
interface ApodResponse {
    date: string;
    title: string;
    explanation: string;
    url: string;
    thumbnail_url?: string; // alleen aanwezig bij video's, met thumbs=true
    media_type: 'image' | 'video';
    copyright?: string;
}

// NASA-widget: toont de astronomische foto (of video) van de dag, met een
// naar het Nederlands vertaalde titel en uitleg.
export class NasaWidget extends CustomElement {
    // Referenties naar de HTML-elementen in nasaWidget.html
    #nasaDate = this.componentBody.querySelector<HTMLSpanElement>('#nasa-date')!;
    #nasaLoading = this.componentBody.querySelector<HTMLDivElement>('#nasa-loading')!;
    #nasaError = this.componentBody.querySelector<HTMLDivElement>('#nasa-error')!;
    #nasaErrorText = this.componentBody.querySelector<HTMLSpanElement>('#nasa-error-text')!;
    #nasaContent = this.componentBody.querySelector<HTMLDivElement>('#nasa-content')!;
    #nasaImage = this.componentBody.querySelector<HTMLImageElement>('#nasa-image')!;
    #nasaVideoContainer =
        this.componentBody.querySelector<HTMLDivElement>('#nasa-video-container')!;
    #nasaVideo = this.componentBody.querySelector<HTMLIFrameElement>('#nasa-video')!;
    #nasaTitle = this.componentBody.querySelector<HTMLHeadingElement>('#nasa-title')!;
    #nasaExplanation = this.componentBody.querySelector<HTMLParagraphElement>('#nasa-explanation')!;
    #nasaCopyright = this.componentBody.querySelector<HTMLParagraphElement>('#nasa-copyright')!;
    #nasaCredit = this.componentBody.querySelector<HTMLDivElement>('#nasa-credit')!;
    #nasaVideoFile = this.componentBody.querySelector<HTMLVideoElement>('#nasa-video-file')!;

    constructor() {
        super(HTML);

        // Meteen de foto van de dag ophalen bij het laden
        this.#getPicture();
    }

    // Haalt de APOD op. Bij een tijdelijke serverfout (NASA is soms wisselvallig)
    // probeert hij het automatisch opnieuw. De parameter telt de pogingen.
    async #getPicture(poging = 1): Promise<void> {
        // Laadscherm tonen, inhoud en oude fout verbergen
        this.#nasaLoading.classList.remove('d-none');
        this.#nasaContent.classList.add('d-none');
        this.#nasaError.classList.add('d-none');

        try {
            // API-sleutel via .env, met DEMO_KEY als terugval; thumbs=true geeft een poster voor video's
            const apiKey = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY';
            const res = await fetch(
                `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&thumbs=true`,
            );

            // Tijdelijke serverfout (5xx) van NASA: even wachten en opnieuw proberen (max 4 pogingen)
            if (res.status >= 500 && poging < 4) {
                await new Promise((r) => setTimeout(r, 1000));
                return this.#getPicture(poging + 1);
            }

            if (!res.ok) {
                this.#showError(
                    'Kon de NASA-foto van vandaag niet laden. Probeer het later opnieuw.',
                );
                return;
            }

            const data: ApodResponse = await res.json();
            await this.#showPicture(data);
        } catch (error) {
            // netwerkfout of iets onverwachts
            console.error(error);
            this.#showError('Kon de NASA-foto van vandaag niet laden.');
        }
    }

    // Vult de kaart met de opgehaalde gegevens
    async #showPicture(data: ApodResponse) {
        // Datum in het Nederlands (bv. 23 juni 2026)
        this.#nasaDate.textContent = new Date(data.date).toLocaleDateString('nl-BE', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });

        // Titel en uitleg tegelijk vertalen (sneller dan na elkaar)
        const [titel, uitleg] = await Promise.all([
            translate(data.title),
            translate(data.explanation),
        ]);
        this.#nasaTitle.textContent = titel.text;
        this.#nasaExplanation.textContent = uitleg.text;
        this.#nasaCredit.textContent = `Vertaald door ${uitleg.engine}`;

        // Auteursrechten (niet altijd aanwezig)
        this.#nasaCopyright.textContent = data.copyright ? `© ${data.copyright.trim()}` : '';

        // Afbeelding of video tonen afhankelijk van het type
        if (data.media_type === 'video') {
            if (data.url.includes('youtube') || data.url.includes('vimeo')) {
                // Insluitbare video (YouTube/Vimeo): in een iframe
                this.#nasaVideo.src = data.url;
                this.#nasaVideoContainer.classList.remove('d-none');
                this.#nasaImage.classList.add('d-none');
                this.#nasaVideoFile.classList.add('d-none');
            } else if (/\.(mp4|webm|ogg)$/i.test(data.url)) {
                // Direct videobestand: HTML5 video-element (geen iframe, dus geen X-Frame-probleem)
                this.#nasaVideoFile.src = data.url;
                this.#nasaVideoFile.classList.remove('d-none');
                this.#nasaImage.classList.add('d-none');
                this.#nasaVideoContainer.classList.add('d-none');
            } else if (data.thumbnail_url) {
                // Andere video: toon de thumbnail als poster
                this.#nasaImage.src = data.thumbnail_url;
                this.#nasaImage.alt = data.title;
                this.#nasaImage.classList.remove('d-none');
                this.#nasaVideoContainer.classList.add('d-none');
                this.#nasaVideoFile.classList.add('d-none');
            } else {
                // Geen bruikbare media: alles verbergen (titel en uitleg blijven)
                this.#nasaImage.classList.add('d-none');
                this.#nasaVideoContainer.classList.add('d-none');
                this.#nasaVideoFile.classList.add('d-none');
            }
        } else {
            // Gewone afbeelding
            this.#nasaImage.src = data.url;
            this.#nasaImage.alt = data.title;
            this.#nasaImage.classList.remove('d-none');
            this.#nasaVideoContainer.classList.add('d-none');
            this.#nasaVideoFile.classList.add('d-none');
        }

        // Pas tonen wanneer alles klaar is (inclusief vertaling)
        this.#nasaLoading.classList.add('d-none');
        this.#nasaContent.classList.remove('d-none');
    }

    // Toont een foutmelding in plaats van de foto (bv. NASA onbereikbaar)
    #showError(bericht: string) {
        this.#nasaLoading.classList.add('d-none');
        this.#nasaContent.classList.add('d-none');
        this.#nasaErrorText.textContent = bericht;
        this.#nasaError.classList.remove('d-none');
    }
}
