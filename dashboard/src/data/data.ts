import { SavedLocation } from '../models/savedLocation';
import { Task } from '../models/task';
import { LocalStoragePersistenceProvider } from './localStoragePersistenceProvider';

export const tasksLocalStorageProvider = new LocalStoragePersistenceProvider<Task>(
    'dashboard-tasks',
);

export const locationsLocalStorageProvider = new LocalStoragePersistenceProvider<SavedLocation>(
    'dashboard-locations',
);
