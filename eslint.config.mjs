import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const FRONTEND_FILES = ["apps/frontend/**/*.{js,mjs,cjs,ts,tsx}"];

const scopeToFrontend = (configs) =>
  configs.map((config) => ({
    ...config,
    files: config.files ?? FRONTEND_FILES,
  }));

export default defineConfig([
  globalIgnores([
    "**/.next/**",
    "**/dist/**",
    "**/node_modules/**",
    "**/coverage/**",
    "**/next-env.d.ts",
  ]),
  {
    files: ["apps/gateway/**", "apps/sage/**", "apps/evidence/**"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    files: FRONTEND_FILES,
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  ...scopeToFrontend([...nextVitals, ...nextTs]),
]);