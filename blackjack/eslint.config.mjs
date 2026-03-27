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
    },
  },
  // Flat-config safe prettier integration
  prettierPlugin.configs["flat/recommended"],
];
