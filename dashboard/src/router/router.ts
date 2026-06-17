import { Page } from './page.ts'

// Een type dat een concrete subklasse van Page voorstelt.
type ConcretePage = new () => Page

// Een map die de URL van een pagina naar de bijhorende klasse mapt.
type RouteMap = Record<string, ConcretePage>

/**
 * Router die navigatie tussen verschillende pagina's in de applicatie mogelijk maakt.
 * Elk HTML-element met een data-link attribuut wordt omgevormd tot een link.
 */
export class Router {
    readonly #pages: RouteMap
    #activePage: Page | null = null

    constructor(pages: RouteMap) {
        this.#pages = pages

        const pathName = window.location.pathname
        this.navigate(this.#pages[pathName] ? pathName : '/')
    }

    navigate(path: string) {
        this.#activePage?.cleanup()

        this.#activePage = new this.#pages[path]()
        this.#activePage.render()

        this.#setupRouter()
    }

    #setupRouter() {
        document.querySelectorAll('[data-link]')?.forEach(link => {
            const path = link.getAttribute('data-link')!
            link.addEventListener('click', (evt) => {
                evt.preventDefault()
                window.history.pushState(null, '', `${window.location.origin}${path}`)
                this.navigate(path)
            })
        })
    }
}
