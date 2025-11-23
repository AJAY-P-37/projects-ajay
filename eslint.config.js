// eslint.config.js (Flat Config)
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import * as tseslint from "typescript-eslint";
// import { parserOptions } from "./apps/backend/.eslintrc";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      react,
      import: importPlugin,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      "import/order": ["warn", { alphabetize: { order: "asc" } }],
      "react/react-in-jsx-scope": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  prettier,
];
