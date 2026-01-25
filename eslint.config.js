import js from "@eslint/js";

export default [
  {
    ignores: [
      "node_modules",
      "dist",
      "archive",
      ".arela",
      "build",
      ".git",
      "public",
      "website/.vitepress",
      "website/node_modules",
    ],
  },
  js.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx,js}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        console: "readonly",
        fetch: "readonly",
        // Node globals
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
    rules: {
      "no-unused-vars": "off",
      "no-constant-condition": "off",
      "no-cond-assign": "off",
      "no-undef": "off",
      "no-empty": "off",
    },
  },
];
