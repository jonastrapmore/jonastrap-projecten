import { CustomElement } from '../../router/customElement.ts'
import HTML from './weatherWidget.html?raw'

export class WeatherWidget extends CustomElement {

    constructor() {
        super(HTML)
    }
}
