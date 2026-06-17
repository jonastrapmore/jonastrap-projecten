import { CustomElement } from '../../router/customElement.ts'
import HTML from './calendarWidget.html?raw'

export class CalendarWidget extends CustomElement {

    constructor() {
        super(HTML)
    }
}
