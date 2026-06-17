import type { Unsubscribe } from '../data/persistenceProvider.ts'

/**
 * Een basisklasse voor alle pagina's in de applicatie.
 */
export abstract class Page {

    protected readonly body: HTMLDivElement
    protected unsubscribe: Unsubscribe[] = []
    static readonly #root = document.querySelector<HTMLDivElement>('#app')!

    protected constructor(body: string) {
        this.body = document.createElement('div')
        this.body.innerHTML = body
    }

    render() {
        Page.#root.innerHTML = ''
        Page.#root.appendChild(this.body)
    }

    cleanup() {
        this.unsubscribe.forEach(x => x())
        this.unsubscribe = []
    }
}
