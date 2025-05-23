import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { defineConfig } from 'eslint/config'
import eslintPluginPrettier from 'eslint-plugin-prettier'
import eslintConfigPrettier from 'eslint-config-prettier'

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    plugins: {
      js,
      prettier: eslintPluginPrettier
    },
    extends: ['js/recommended', 'eslint-config-prettier'],
    rules: {
      'prettier/prettier': 'error', // Marca problemas de formatação do Prettier como erros no ESLint
      'no-unused-vars': 'warn' // Opcional: avisa sobre variáveis não utilizadas
    }
  },
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } }
  },
  {
    files: ['**/*.ts'],
    extends: [...tseslint.configs.recommended, 'eslint-config-prettier'],
    rules: {
      'prettier/prettier': 'error'
    }
  },
  eslintConfigPrettier
])
