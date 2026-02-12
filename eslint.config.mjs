import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import sonarjs from "eslint-plugin-sonarjs";
import unicorn from "eslint-plugin-unicorn";
import security from "eslint-plugin-security";
import perfectionist from "eslint-plugin-perfectionist";

export default tseslint.config(
  // Base JS rules
  js.configs.recommended,

  // TypeScript strict type-aware rules
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // Next.js
  ...nextVitals,
  ...nextTs,

  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    plugins: {
      import: importPlugin,
      "unused-imports": unusedImports,
      "simple-import-sort": simpleImportSort,
      sonarjs,
      unicorn,
      security,
      perfectionist,
    },

    rules: {
      /* ------------------ TYPESCRIPT STRICTNESS ------------------ */

      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/consistent-type-exports": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/require-await": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/no-non-null-assertion": "error",

      /* ------------------ IMPORT DISCIPLINE ------------------ */

      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],

      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",

      "import/no-cycle": "error",
      "import/no-duplicates": "error",
      "import/newline-after-import": "error",
      "import/no-default-export": "off", // Next.js uses default exports

      /* ------------------ CODE QUALITY ------------------ */

      "sonarjs/no-duplicate-string": "warn",
      "sonarjs/cognitive-complexity": ["warn", 15],

      "unicorn/prefer-node-protocol": "error",
      "unicorn/no-array-for-each": "error",
      "unicorn/consistent-function-scoping": "error",
      "unicorn/prefer-module": "error",
      "unicorn/prevent-abbreviations": "off",

      /* ------------------ SECURITY ------------------ */

      "security/detect-object-injection": "off",
      "security/detect-non-literal-fs-filename": "warn",

      /* ------------------ CLEAN CODE STYLE ------------------ */

      "perfectionist/sort-objects": ["warn", { type: "natural" }],
      "perfectionist/sort-union-types": "warn",
      "perfectionist/sort-interfaces": "warn",

      /* ------------------ GENERAL SAFETY ------------------ */

      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "eqeqeq": ["error", "always"],
      "curly": "error",

      /* ------------------ REACT / NEXT ------------------ */

      "react-hooks/exhaustive-deps": "error",
      "react-hooks/rules-of-hooks": "error",
    },
  },

  // Ignore build outputs
  {
    ignores: [
      ".next/**",
      "out/**", 
      "build/**",
      "dist/**",
      "coverage/**",
      "next-env.d.ts",
      "test-sheets.js",
      "create-user.js",
      "*.config.mjs",
    ],
  }
);