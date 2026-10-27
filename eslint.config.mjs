import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

// Regras recomendadas do Next (Core Web Vitals + TypeScript). Rode com: npm run lint
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // variáveis com _ na frente são descartadas de propósito (ex.: tirar campos secretos do usuário)
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    // scripts de linha de comando rodam direto no Node, em CommonJS
    files: ["scripts/**/*.js", "database/**/*.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "node_modules/**", ".data/**"]),
])
