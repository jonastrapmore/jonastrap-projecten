import { Persistable } from '../data/persistenceProvider.ts'

export interface Task extends Persistable {
    id: string
    title: string
    done: boolean
    createdAt: string   // ISO-datumstring
}
