import { Task } from '../models/task';
import { LocalStoragePersistenceProvider } from './localStoragePersistenceProvider';

export const tasksLocalStorageProvider = new LocalStoragePersistenceProvider<Task>(
    'dashboard-tasks',
);
