import js from "@eslint/js";

export default [
  { ignores: ["node_modules/**", "coverage/**", "dist/**", "netlify/**"] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        document: "readonly",
        window: "readonly",
        location: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        Blob: "readonly",
        FormData: "readonly",
        XMLHttpRequest: "readonly",
        fetch: "readonly",
        requestAnimationFrame: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        console: "readonly",
        alert: "readonly",
        google: "readonly"
      }
    }
  },
  {
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", caughtErrors: "none" }],
      "preserve-caught-error": "off"
    }
  }
];