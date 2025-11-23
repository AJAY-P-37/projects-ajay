import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import eslintPluginImport from "eslint-plugin-import";

export default [
  {
    files: ["**/*.ts", "**/*.js"],
    ignores: ["dist/**", "generated/**"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ["./tsconfig.json", "./tsconfig.dev.json"],
        tsconfigRootDir: __dirname,
        sourceType: "module",
      },

      ecmaVersion: "latest",
    },
    plugins: {
      "@typescript-eslint": tseslint,
      import: eslintPluginImport,
    },
    rules: {
      quotes: ["error", "double"],
      indent: ["error", 2],
      "import/no-unresolved": "off",
    },
  },
];
