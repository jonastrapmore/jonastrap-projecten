import { defineConfig } from 'vite';

export default defineConfig({
    // De app draait online in de submap /dashboard/, dus moeten de asset-paden
    // daarnaar verwijzen (anders zoekt de browser ze op de domeinroot).
    base: '/dashboard/',
});
