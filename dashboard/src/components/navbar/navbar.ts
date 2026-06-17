import { getTheme, toggleTheme } from '../../effects/theme.ts';
import { CustomElement } from '../../router/customElement.ts';
import HTML from './navbar.html?raw';

// Navbar component: toont het uur, de datum, een begroeting en de theme toggle.
export class CustomNavbar extends CustomElement {
    // Referenties naar de HTML-elementen in navbar.html
    #themeToggle = this.componentBody.querySelector<HTMLButtonElement>('#theme-toggle')!;
    #themeIcon = this.componentBody.querySelector<HTMLSpanElement>('#theme-icon')!;
    #navbarClock = this.componentBody.querySelector<HTMLSpanElement>('#navbar-clock')!;
    #navbarDate = this.componentBody.querySelector<HTMLSpanElement>('#navbar-date')!;
    #navbarGreeting = this.componentBody.querySelector<HTMLSpanElement>('#navbar-greeting')!;

    constructor() {
        super(HTML);

        // Stel het juiste icoon in op basis van het opgeslagen thema
        this.#updateIcon(getTheme());

        // Wissel tussen licht en donker thema bij klikken op de knop
        this.#themeToggle.addEventListener('click', () => {
            const next = toggleTheme();
            this.#updateIcon(next);
        });

        // Toon meteen de tijd bij het laden, daarna elke seconde verversen
        this.#updateTime();
        window.setInterval(() => {
            this.#updateTime();
        }, 1000);
    }

    // Pas het icoontje aan afhankelijk van het actieve thema
    #updateIcon(theme: string): void {
        this.#themeIcon.className = theme === 'dark' ? 'bi bi-sun' : 'bi bi-moon-stars';
    }

    // Ververs het uur, de datum en de begroeting
    // Wordt elke seconde aangeroepen via setInterval zodat alles correct blijft bij middernacht
    #updateTime() {
        const currentDateTime = new Date();

        // Uur opmaken met voorloopnul (bv. 09:05:03)
        const hours = ('0' + currentDateTime.getHours()).slice(-2);
        const mins = ('0' + currentDateTime.getMinutes()).slice(-2);
        const sec = ('0' + currentDateTime.getSeconds()).slice(-2);
        this.#navbarClock.textContent = hours + ':' + mins + ':' + sec;

        // Datum in het Nederlands (bv. do 18 jun)
        this.#navbarDate.textContent = currentDateTime.toLocaleDateString('nl-BE', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        });

        // Begroeting op basis van het uur van de dag
        this.#navbarGreeting.textContent =
            currentDateTime.getHours() < 12
                ? 'Goedemorgen'
                : currentDateTime.getHours() < 18
                  ? 'Goedemiddag'
                  : 'Goedenavond';
    }
}
