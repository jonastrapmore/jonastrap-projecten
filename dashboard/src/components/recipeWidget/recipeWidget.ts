import { CustomElement } from '../../router/customElement.ts'
import HTML from './recipeWidget.html?raw'

export class RecipeWidget extends CustomElement {

    constructor() {
        super(HTML)
    }
}
