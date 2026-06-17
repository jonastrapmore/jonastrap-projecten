import { Persistable, PersistenceProvider } from './persistenceProvider.ts'

export class LocalStoragePersistenceProvider<T extends Persistable> extends PersistenceProvider<T> {

    readonly key: string
    #data: T[] = []

    constructor(key: string, initialData: T[] = []) {
        super()
        this.key = key
        const localData = localStorage.getItem(key)
        this.#data = localData ? JSON.parse(localData) : initialData
    }

    async create(data: Omit<T, 'id'>): Promise<T> {
        const newObject = { ...data, id: window.crypto.randomUUID() } as T
        this.#data.push(newObject)
        localStorage.setItem(this.key, JSON.stringify(this.#data))
        this.notifyObservers(this.#data)
        return newObject
    }

    async delete(id: string): Promise<void> {
        this.#data = this.#data.filter(x => x.id !== id)
        localStorage.setItem(this.key, JSON.stringify(this.#data))
        this.notifyObservers(this.#data)
        this.notifyItemObservers(id, null)
    }

    async get(id: string): Promise<T> {
        const item = this.#data.find(x => x.id === id)
        if (!item) {
            throw new Error(`No item found with the given id: ${id}`)
        }
        localStorage.setItem(this.key, JSON.stringify(this.#data))
        this.notifyObservers(this.#data)
        this.notifyItemObservers(id, item)
        return item
    }

    async getAll(): Promise<T[]> {
        this.notifyObservers(this.#data)
        return this.#data
    }

    async update(id: string, data: T): Promise<T> {
        const index = this.#data.findIndex(x => x.id === id)
        if (index === -1) {
            throw new Error(`No item found with the given id: ${id}`)
        }
        this.#data[index] = { ...this.#data[index], ...data, id: this.#data[index].id }
        localStorage.setItem(this.key, JSON.stringify(this.#data))
        this.notifyObservers(this.#data)
        this.notifyItemObservers(id, this.#data[index])
        return this.#data[index]
    }
}
