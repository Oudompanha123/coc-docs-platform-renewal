import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/**
 * Areas already migrated to the shared primitives in `components/ui`
 * (ADR-104 decision 7). A raw `<button>` or `<input>` is an error inside
 * these paths and unremarked everywhere else, and this list grows by one
 * entry per migration PR.
 *
 * Scoped rather than global on purpose. 97 files still hold a raw
 * `<button>`; switching the rule on across all of them would bury the two
 * real warnings this project has under hundreds of expected ones and make
 * `npm run lint` worthless for the length of the migration. Scoping it means
 * a migrated area can never quietly regress, which is the part that matters.
 *
 * An affordance that genuinely is not one of the primitives takes an
 * `eslint-disable-next-line` with a reason on it. The rule exists to stop
 * the next hand-rolled submit button, not to ban the element.
 */
const MIGRATED_TO_UI_PRIMITIVES = [
  "components/ui/**/*.tsx",
  "components/auth/**/*.tsx",
  "app/login/**/*.tsx",
  "app/register/**/*.tsx",
  "app/forgot-password/**/*.tsx",
  "app/reset-password/**/*.tsx",
  "app/create-password/**/*.tsx",
];

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    files: MIGRATED_TO_UI_PRIMITIVES,
    ignores: ["components/ui/**/*.tsx"],
    rules: {
      "react/forbid-elements": [
        "error",
        {
          forbid: [
            { element: "button", message: "Use <Button> from @/components/ui/button (ADR-104)." },
            { element: "input", message: "Use <Input> from @/components/ui/input (ADR-104)." },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
