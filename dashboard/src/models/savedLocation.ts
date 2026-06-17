import { Persistable } from '../data/persistenceProvider.ts'

export interface SavedLocation extends Persistable {
    id: string
    name: string    // Weergavenaam (bv. "Geel" of "2440")
    query: string   // Zoekopdracht die aan de API meegegeven wordt
}
