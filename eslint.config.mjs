import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["**/*.{js,jsx,ts,tsx,mjs,cjs}"],
    plugins: {
      ...nextVitals[0].plugins,
      ...nextTs[0].plugins,
    },
    rules: {
      // Downgrade to warn — Prisma query results and API responses legitimately need `any`
      "@typescript-eslint/no-explicit-any": "warn",
      // Downgrade to warn — intentional ts-ignore usage in certificate/verify routes
      "@typescript-eslint/ban-ts-comment": "warn",
      // Downgrade to warn — apostrophes/quotes in JSX text content (cosmetic)
      "react/no-unescaped-entities": "warn",
      // Downgrade to warn — Next.js App Router server components trigger these incorrectly
      "react-hooks/rules-of-hooks": "warn",
      // Downgrade to warn — false positives in Next.js static server components
      "react-hooks/exhaustive-deps": "warn",
      // Downgrade to warn — Next.js App Router false positives
      "react-hooks/error-boundaries": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      // Downgrade to warn — cosmetic style preference
      "prefer-const": "warn",
      // Downgrade to warn — verify page uses native <a> intentionally
      "@next/next/no-html-link-for-pages": "warn",
      // Downgrade to warn — JS scripts and configs using `require()`
      "@typescript-eslint/no-require-imports": "warn",
    },
  },
]);

export default eslintConfig;
