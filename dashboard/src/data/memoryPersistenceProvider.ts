import { Persistable, PersistenceProvider } from './persistenceProvider.ts'

export class MemoryPersistenceProvider<T extends Persistable> extends PersistenceProvider<T> {

    #data: T[] = []

    constructor(initialData: T[] = []) {
        super()
        this.#data = initialData
    }

    async create(data: Omit<T, 'id'> & { id?: string }): Promise<T> {
        const newObject = { ...data, id: data.id ?? window.crypto.randomUUID() } as T
        this.#data.push(newObject)
        this.notifyObservers(this.#data)
        return newObject
    }

    async delete(id: string): Promise<void> {
        this.#data = this.#data.filter(x => x.id !== id)
        this.notifyObservers(this.#data)
        this.notifyItemObservers(id, null)
    }

    async get(id: string): Promise<T> {
        const item = this.#data.find(x => x.id === id)
        if (!item) {
            throw new Error(`No item found with the given id: ${id}`)
        }
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
        this.notifyObservers(this.#data)
        this.notifyItemObservers(id, this.#data[index])
        return this.#data[index]
    }
}
