import js from "@eslint/js";
import prettierPlugin from "eslint-plugin-prettier";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
  window: "readonly",
  document: "readonly",
  setTimeout: "readonly",
  requestAnimationFrame: "readonly",
  alert: "readonly",
  confirm: "readonly", // 👈 ajoute
  Image: "readonly",   // 👈 ajoute
  console: "readonly",
  URLSearchParams: "readonly",
  fetch: "readonly",
},
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": "warn",
    },
  },
];
