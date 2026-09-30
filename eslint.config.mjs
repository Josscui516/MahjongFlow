import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Keep framework defaults and exclude generated or local-only artifacts.
  globalIgnores([
    "tmp/**",
    "temp/**",
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "coverage/**",
    "test-results/**",
    "playwright-report/**",
    ".supabase/**",
    "supabase/.temp/**",
    ".vercel/**",
    "next-env.d.ts",
    "src/types/database.generated.ts",
  ]),
]);

export default eslintConfig;
