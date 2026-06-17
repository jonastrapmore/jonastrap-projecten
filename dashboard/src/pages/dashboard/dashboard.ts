import { Page } from '../../router/page.ts'
import HTML from './dashboard.html?raw'

export class DashboardPage extends Page {

    constructor() {
        super(HTML)
    }

    render(): void {
        super.render()
    }
}
