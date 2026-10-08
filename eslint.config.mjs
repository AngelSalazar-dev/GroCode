import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Fases 7.2–7.4: etiquetas de formulario, dialogos y estados de toggle.
      // Subidas a "error" a proposito: son defectos de accesibilidad, no estilo.
      // El plugin lo registra `eslint-config-next`; no hay que redefinirlo.
      "jsx-a11y/label-has-associated-control": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-proptypes": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/role-supports-aria-props": "error",
      "jsx-a11y/click-events-have-key-events": "error",
      "jsx-a11y/no-static-element-interactions": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/autocomplete-valid": "warn",
      "jsx-a11y/no-redundant-roles": "warn",
      // `_`-prefixed bindings are intentionally unused (e.g. a reducer
      // parameter required only to satisfy a signature).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "none",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Prisma generated client
    "src/generated/**",
    "src/generated-v2/**",
    // Vendored axe-core, copied in only to run scripts/a11y-audit.mjs. Minified
    // third-party code is not ours to lint. Regenerate with:
    //   npm i --no-save axe-core
    //   cp node_modules/axe-core/axe.min.js public/axe.min.js
    "public/axe.min.js",
  ]),
]);

export default eslintConfig;