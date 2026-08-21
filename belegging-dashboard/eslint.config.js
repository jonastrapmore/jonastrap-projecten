import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
    globalIgnores(['dist']),
    {
        files: ['**/*.{ts,tsx}'],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
            reactHooks.configs.flat.recommended,
            reactRefresh.configs.vite,
        ],
        languageOptions: {
            globals: globals.browser,
        },
        rules: {
            // Toestaan dat je een veld weglaat door het te destructureren:
            //   const { timestamp, ...rest } = transaction
            // Die `timestamp` wordt bewust niet gebruikt, dat is het hele punt.
            '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
        },
    },
]);
