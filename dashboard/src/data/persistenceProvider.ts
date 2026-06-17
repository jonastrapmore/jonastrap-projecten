export interface Persistable {
    id: string
}

export type ChangeObserver<T extends Persistable> = (data: T[]) => void
export type ItemChangeObserver<T extends Persistable> = (data: T | null) => void
export type Unsubscribe = () => void

export abstract class PersistenceProvider<T extends Persistable> {

    protected observers: ChangeObserver<T>[] = []
    protected itemObservers: Record<string, ItemChangeObserver<T>[]> = {}

    addObserver(observer: ChangeObserver<T>): Unsubscribe {
        this.observers.push(observer)
        return () => {
            this.observers = this.observers.filter(x => x !== observer)
        }
    }

    addItemObserver(id: string, observer: ItemChangeObserver<T>): Unsubscribe {
        if (!this.itemObservers[id]) {
            this.itemObservers[id] = []
        }
        this.itemObservers[id].push(observer)
        return () => {
            this.itemObservers[id] = this.itemObservers[id].filter(x => x !== observer)
        }
    }

    protected notifyObservers(data: T[]) {
        this.observers.forEach(observer => observer(data))
    }

    protected notifyItemObservers(id: string, data: T | null) {
        this.itemObservers[id]?.forEach(observer => observer(data))
    }

    abstract create(data: Omit<T, 'id'>): Promise<T>
    abstract get(id: string): Promise<T>
    abstract getAll(): Promise<T[]>
    abstract update(id: string, data: T): Promise<T>
    abstract delete(id: string): Promise<void>
}
