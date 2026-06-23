/// <reference types="vite/client" />
import { translate } from '../../effects/translate.ts';
import { CustomElement } from '../../router/customElement.ts';
import HTML from './recipeWidget.html?raw';

// Vorm van een recept uit de Spoonacular-API (alleen de velden die we gebruiken)
interface Recipe {
    id: number;
    title: string;
    image: string;
    sourceUrl: string;
    cuisines: string[];
    dishTypes: string[];
    extendedIngredients: { original: string }[];
    pricePerServing: number; // in dollarcenten per portie
    nutrition: {
        nutrients: { name: string; amount: number; unit: string }[];
    };
}

// Keukens waaruit we willekeurig kiezen. Door een keuken op te vragen heeft een recept
// altijd een herkomst, want Spoonacular vult dat veld lang niet altijd vanzelf in.
const KEUKENS = [
    'British',
    'Eastern European',
    'European',
    'French',
    'German',
    'Greek',
    'Irish',
    'Italian',
    'Mediterranean',
    'Nordic',
    'Spanish',
    'American',
    'Mexican',
    'Indian',
];

// Receptwidget ("Menu van de dag"): toont een willekeurig recept via Spoonacular,
// met filters (keto, low calorie, snel klaar), vertaalde inhoud en voedingswaarde-badges.
export class RecipeWidget extends CustomElement {
    // Referenties naar de HTML-elementen in recipeWidget.html
    #recipeLoading = this.componentBody.querySelector<HTMLDivElement>('#recipe-loading')!;
    #recipeContent = this.componentBody.querySelector<HTMLDivElement>('#recipe-content')!;
    #recipeImage = this.componentBody.querySelector<HTMLImageElement>('#recipe-image')!;
    #recipeName = this.componentBody.querySelector<HTMLHeadingElement>('#recipe-name')!;
    #recipeCategory = this.componentBody.querySelector<HTMLSpanElement>('#recipe-category')!;
    #recipeArea = this.componentBody.querySelector<HTMLSpanElement>('#recipe-area')!;
    #recipeIngredientsList = this.componentBody.querySelector<HTMLUListElement>(
        '#recipe-ingredients-list',
    )!;
    #recipeSourceLink = this.componentBody.querySelector<HTMLAnchorElement>('#recipe-source-link')!;
    #recipeRefreshBtn = this.componentBody.querySelector<HTMLButtonElement>('#recipe-refresh')!;
    #recipeCredit = this.componentBody.querySelector<HTMLDivElement>('#recipe-credit')!;
    #filterKeto = this.componentBody.querySelector<HTMLInputElement>('#filter-keto')!;
    #filterLowcal = this.componentBody.querySelector<HTMLInputElement>('#filter-lowcal')!;
    #filterQuick = this.componentBody.querySelector<HTMLInputElement>('#filter-quick')!;
    #recipeCalories = this.componentBody.querySelector<HTMLSpanElement>('#recipe-calories')!;
    #recipeCarbs = this.componentBody.querySelector<HTMLSpanElement>('#recipe-carbs')!;
    #recipePrice = this.componentBody.querySelector<HTMLSpanElement>('#recipe-price')!;

    constructor() {
        super(HTML);

        // Shuffle-knop laadt een ander recept
        this.#recipeRefreshBtn.addEventListener('click', () => this.#getRandomRecipe());

        // Bij het aan- of uitvinken van een filter laadt er meteen een passend recept
        [this.#filterKeto, this.#filterLowcal, this.#filterQuick].forEach((checkbox) => {
            checkbox.addEventListener('change', () => this.#getRandomRecipe());
        });

        // Meteen een recept tonen bij het laden van de pagina
        this.#getRandomRecipe();
    }

    // Haalt een willekeurig recept op (rekening houdend met de actieve filters) en toont het
    async #getRandomRecipe() {
        // Laadscherm tonen, inhoud verbergen tot alles binnen is
        this.#recipeLoading.classList.remove('d-none');
        this.#recipeContent.classList.add('d-none');

        // Willekeurige keuken zodat het recept altijd een herkomst heeft
        const keuken = KEUKENS[Math.floor(Math.random() * KEUKENS.length)];

        try {
            const apiKey = import.meta.env.VITE_SPOONACULAR_API_KEY;
            const params = new URLSearchParams({
                apiKey,
                number: '5',
                cuisine: keuken,
                sort: 'random',
                addRecipeInformation: 'true',
                addRecipeNutrition: 'true', // nodig voor calorieën, koolhydraten en prijs
                fillIngredients: 'true',
            });

            // Keto is een echte diet-filter van Spoonacular
            const diets: string[] = [];
            if (this.#filterKeto.checked) diets.push('ketogenic');
            if (diets.length > 0) {
                params.set('diet', diets.join(','));
            }

            // Low calorie en snel klaar zijn aparte parameters
            if (this.#filterLowcal.checked) {
                params.set('maxCalories', '500');
            }
            if (this.#filterQuick.checked) {
                params.set('maxReadyTime', '30'); // klaar binnen 30 minuten
            }

            const res = await fetch(`https://api.spoonacular.com/recipes/complexSearch?${params}`);
            if (!res.ok) {
                throw new Error(`Geen recept gevonden (status ${res.status})`);
            }
            const data: { results: Recipe[] } = await res.json();

            // Geen resultaten (bv. te strenge filtercombinatie)
            if (!data.results || data.results.length === 0) {
                throw new Error('Geen recept gevonden voor deze filters');
            }

            // Willekeurig recept uit de resultaten kiezen
            const gekozen = data.results[Math.floor(Math.random() * data.results.length)];
            await this.#showMeal(gekozen);
        } catch (error) {
            console.error(error);
        }
    }

    // Vult de kaart met het recept (afbeelding, naam, badges, links)
    async #showMeal(recipe: Recipe) {
        const naam = await translate(recipe.title);
        this.#recipeImage.src = recipe.image;
        this.#recipeImage.alt = recipe.title;
        this.#recipeName.textContent = naam.text;

        // dishTypes/cuisines kunnen leeg zijn, dus met ?? '' afvangen
        const categorie = await translate(recipe.dishTypes[0] ?? '');
        const herkomst = await translate(recipe.cuisines[0] ?? '');
        this.#recipeCategory.textContent = categorie.text;
        this.#recipeArea.textContent = herkomst.text;

        this.#recipeSourceLink.href = recipe.sourceUrl ?? '#';

        // Voedingswaarde en prijs als badges (uit de nutrients-lijst)
        const calorieen = recipe.nutrition.nutrients.find((n) => n.name === 'Calories');
        const koolhydraten = recipe.nutrition.nutrients.find((n) => n.name === 'Carbohydrates');

        if (calorieen) {
            this.#recipeCalories.textContent = `${Math.round(calorieen.amount)} kcal`;
            this.#recipeCalories.classList.remove('d-none');
        }
        if (koolhydraten) {
            this.#recipeCarbs.textContent = `${Math.round(koolhydraten.amount)} g koolhydraten`;
            this.#recipeCarbs.classList.remove('d-none');
        }
        // pricePerServing is in dollarcenten, dus delen door 100 voor dollars
        this.#recipePrice.textContent = `$${(recipe.pricePerServing / 100).toFixed(2)} per portie`;
        this.#recipePrice.classList.remove('d-none');

        await this.#renderIngredients(recipe);

        // Pas tonen wanneer alles (inclusief vertaalde ingredienten) klaar is
        this.#recipeLoading.classList.add('d-none');
        this.#recipeContent.classList.remove('d-none');
    }

    // Bouwt de ingredientenlijst op, vertaald in één gebundelde aanvraag
    async #renderIngredients(recipe: Recipe) {
        this.#recipeIngredientsList.innerHTML = '';

        // Alle ingredientregels verzamelen en in één keer vertalen (spaart API-aanroepen)
        const regels = (recipe.extendedIngredients ?? []).map((i) => i.original);
        const { text, engine } = await translate(regels.join('\n'));
        const vertaaldeRegels = text.split('\n');
        this.#recipeCredit.textContent = `Vertaald door ${engine}`;

        regels.forEach((origineel, index) => {
            const li = document.createElement('li');
            // Terugval op het origineel als het splitsen niet exact klopt
            li.textContent = vertaaldeRegels[index] ?? origineel;

            const liI = document.createElement('i');
            liI.className = 'bi bi-dot';
            li.prepend(liI);

            this.#recipeIngredientsList.appendChild(li);
        });
    }
}
