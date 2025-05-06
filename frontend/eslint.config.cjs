const { FlatCompat } = require("@eslint/eslintrc");
const { dirname } = require("path");
const { fileURLToPath } = require("url");

// Use CommonJS syntax, removing `import.meta.url`
const __filename = fileURLToPath(__filename);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

module.exports = {
  ...compat.config({
    extends: ["next/core-web-vitals", "plugin:@typescript-eslint/recommended"],
  }),
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "react-hooks/exhaustive-deps": "off",
    "react-hooks/rules-of-hooks": "error",
    "prefer-const": "warn",
    "@typescript-eslint/no-explicit-any": "off",
    "react/no-unescaped-entities": "off",
    "@typescript-eslint/no-wrapper-object-types": "off",
  },
};
