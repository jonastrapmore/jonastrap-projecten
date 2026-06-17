import { CustomElement } from '../../router/customElement.ts'
import HTML from './notesWidget.html?raw'

export class NotesWidget extends CustomElement {

    constructor() {
        super(HTML)
    }
}
