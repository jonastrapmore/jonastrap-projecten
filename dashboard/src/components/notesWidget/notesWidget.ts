import { tasksLocalStorageProvider } from '../../data/data.ts';
import { Task } from '../../models/task.ts';
import { CustomElement } from '../../router/customElement.ts';
import HTML from './notesWidget.html?raw';

// Takenwidget: taken toevoegen, afvinken, verwijderen, filteren en een teller bijhouden.
// De data wordt bewaard via de LocalStorage-provider; een observer zorgt voor automatisch herrenderen.
export class NotesWidget extends CustomElement {
    // Referenties naar de HTML-elementen in notesWidget.html
    #taskInput = this.componentBody.querySelector<HTMLInputElement>('#task-input')!;
    #taskAddBtn = this.componentBody.querySelector<HTMLButtonElement>('#task-add')!;
    #tasksList = this.componentBody.querySelector<HTMLUListElement>('#tasks-list')!;
    #tasksCount = this.componentBody.querySelector<HTMLSpanElement>('#tasks-count')!;
    #tasksEmpty = this.componentBody.querySelector<HTMLDivElement>('#tasks-empty')!;
    #tasksClearDone = this.componentBody.querySelector<HTMLButtonElement>('#tasks-clear-done')!;
    #tasksFilterList = this.componentBody.querySelectorAll<HTMLButtonElement>('[data-filter]');

    // Het actieve filter: 'all', 'open' of 'done'
    #activeFilter = 'all';
    // Lokale kopie van de taken (wordt door de observer bijgewerkt)
    #tasks: Task[] = [];

    constructor() {
        super(HTML);

        // Taak toevoegen via de knop
        this.#taskAddBtn.addEventListener('click', () => this.#addTask());

        // Taak toevoegen via de Enter-toets in het invoerveld
        this.#taskInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.#addTask();
            }
        });

        // Alle voltooide taken in één keer verwijderen
        this.#tasksClearDone.addEventListener('click', () => this.#clearDone());

        // Filterknoppen koppelen (Alle / Open / Klaar) op basis van hun data-filter attribuut
        this.#tasksFilterList.forEach((filter) => {
            filter.addEventListener('click', () => this.#filter(filter.dataset['filter']));
        });

        // Observer: bij elke wijziging in de data wordt de lijst opnieuw opgebouwd
        tasksLocalStorageProvider.addObserver((tasks) => {
            this.#tasks = tasks;
            this.#renderTasks();
        });
        // Eén keer ophalen om de eerste render te triggeren
        tasksLocalStorageProvider.getAll();
    }

    // Maakt een nieuwe taak aan op basis van de invoer
    async #addTask() {
        const taskTitle = this.#taskInput.value.trim();

        // Lege invoer negeren
        if (taskTitle === '') {
            return;
        }

        // De provider notificeert zelf de observer, die daarna herrendert
        await tasksLocalStorageProvider.create({
            title: taskTitle,
            done: false,
            createdAt: new Date().toISOString(),
        });

        // Invoerveld leegmaken voor de volgende taak
        this.#taskInput.value = '';
    }

    // Verwijdert alle taken die als voltooid gemarkeerd zijn
    #clearDone() {
        this.#tasks.forEach((task) => {
            if (task.done) {
                tasksLocalStorageProvider.delete(task.id);
            }
        });
    }

    // Wisselt het actieve filter en herrendert de lijst
    #filter(value: string | undefined) {
        // Veiligheid: zonder geldige waarde doen we niets
        if (!value) return;

        this.#activeFilter = value;

        // Enkel de aangeklikte knop de 'active'-stijl geven
        this.#tasksFilterList.forEach((btn) => {
            btn.classList.toggle('active', btn.dataset['filter'] === value);
        });

        // Filteren is een UI-wijziging (geen datawijziging), dus zelf herrenderen
        this.#renderTasks();
    }

    // Bouwt de takenlijst opnieuw op, werkt de teller bij en toont/verbergt de lege toestand
    #renderTasks() {
        // Bestaande lijst leegmaken
        this.#tasksList.innerHTML = '';

        // Enkel de taken die bij het actieve filter passen tonen
        const visibleTasks = this.#tasks.filter((task) => this.#taskMatchesFilter(task));
        visibleTasks.forEach((task) => {
            const taskRow = this.#createTaskItem(task);
            this.#tasksList.appendChild(taskRow);
        });

        // Lege toestand tonen wanneer er niks zichtbaar is
        this.#tasksEmpty.classList.toggle('d-none', visibleTasks.length > 0);

        // Teller telt de openstaande taken over ALLE taken (los van het filter)
        const count = this.#tasks.filter((task) => !task.done).length;
        this.#tasksCount.textContent = count.toString();
    }

    // Maakt het <li>-element voor één taak (checkbox, label en verwijderknop)
    #createTaskItem(task: Task): HTMLLIElement {
        const taskLi = document.createElement('li');
        taskLi.className = 'task-item';
        taskLi.dataset.id = task.id;

        // Voltooide taak krijgt de 'done'-klasse (doorstreping via CSS)
        if (task.done) {
            taskLi.classList.add('done');
        }

        // Checkbox om de taak af te vinken
        const taskCheckBox = document.createElement('input');
        taskCheckBox.type = 'checkbox';
        taskCheckBox.className = 'form-check-input m-0';
        taskCheckBox.checked = task.done;

        // Bij wijziging de done-status opslaan via de provider (observer herrendert)
        taskCheckBox.addEventListener('change', () => {
            tasksLocalStorageProvider.update(task.id, { ...task, done: taskCheckBox.checked });
        });

        // Tekstlabel met de titel van de taak
        const taskLabel = document.createElement('span');
        taskLabel.className = 'task-label';
        taskLabel.textContent = task.title;

        // Verwijderknop
        const taskDeleteBtn = document.createElement('button');
        taskDeleteBtn.type = 'button';
        taskDeleteBtn.className = 'task-delete';
        taskDeleteBtn.ariaLabel = 'Taak verwijderen';

        // Bij klik de taak verwijderen via de provider (observer herrendert)
        taskDeleteBtn.addEventListener('click', () => {
            tasksLocalStorageProvider.delete(task.id);
        });

        // Prullenbak-icoon binnen de verwijderknop
        const taskI = document.createElement('i');
        taskI.className = 'bi bi-x-lg';

        // Alles samenvoegen tot één rij
        taskDeleteBtn.appendChild(taskI);
        taskLi.appendChild(taskCheckBox);
        taskLi.appendChild(taskLabel);
        taskLi.appendChild(taskDeleteBtn);

        return taskLi;
    }

    // Bepaalt of een taak bij het actieve filter past
    #taskMatchesFilter(task: Task): boolean {
        if (this.#activeFilter === 'open') {
            return !task.done; // alleen niet-voltooide taken
        }
        if (this.#activeFilter === 'done') {
            return task.done; // alleen voltooide taken
        }
        return true; // 'all' → alles tonen
    }
}
