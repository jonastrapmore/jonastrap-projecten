import { CustomElement } from '../../router/customElement.ts'
import HTML from './nasaWidget.html?raw'

export class NasaWidget extends CustomElement {

    constructor() {
        super(HTML)
    }
}
