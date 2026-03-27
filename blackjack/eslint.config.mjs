import js from "@eslint/js";
import prettierPlugin from "eslint-plugin-prettier";

export default [
  { ignores: ["dist"] },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      // Browser runtime globals
      globals: {
        window: "readonly",
        document: "readonly",
        setTimeout: "readonly",
        requestAnimationFrame: "readonly",
        alert: "readonly",
        console: "readonly",
        URLSearchParams: "readonly",
      },
    },
    plugins: { prettier: prettierPlugin },
    rules: {
      "prettier/prettier": "warn",
    },
  },
];
