/* eslint-disable @typescript-eslint/no-require-imports */
// eslint.config.js

/**
 * ⚙️ ESLint Flat Config Setup for Expo + TypeScript Monorepo
 * ----------------------------------------------------------
 * - Extends Expo config (React + TS + Import plugin)
 * - Adds custom rules
 * - Prettier integration
 * - Filters tsconfig.json files to avoid parser "read file" errors
 */

const fs = require("fs");
const tsParser = require("@typescript-eslint/parser");
const prettierPlugin = require("eslint-plugin-prettier");
const expoConfig = require("eslint-config-expo/flat");

// Inject our small TypeScript rule overrides into the Expo TypeScript config
// rather than redefining the plugin elsewhere (ESLint flat config requires
// plugin rules to be defined in the same config object that defines the plugin).
try {
  const tsOverrideRules = {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-require-imports': 'warn',
  };

  const tsIndex = expoConfig.findIndex((cfg) => Array.isArray(cfg.files) && cfg.files.includes('**/*.ts'));
  if (tsIndex !== -1) {
    expoConfig[tsIndex].rules = Object.assign({}, expoConfig[tsIndex].rules || {}, tsOverrideRules);
  } else {
    // if expo doesn't include a ts block for some reason, add one that defines the plugin
    const typescriptEslint = require('@typescript-eslint/eslint-plugin');
    const tsParser = require('@typescript-eslint/parser');
    expoConfig.push({
      files: ['**/*.ts', '**/*.tsx', '**/*.d.ts'],
      plugins: { '@typescript-eslint': typescriptEslint },
      languageOptions: { parser: tsParser },
      rules: tsOverrideRules,
    });
  }
} catch (e) {
  // if anything goes wrong while mutating expoConfig, fall back silently
  // — we don't want to crash linting. Log to console for debugging.
  // eslint-disable-next-line no-console
  console.error('Failed to apply TS overrides to expoConfig:', e && e.message);
}

// 🔧 Only include tsconfig.json files that exist
const tsProjects = [
  "./packages/core/tsconfig.json",
  "./apps/web/tsconfig.json",
  "./apps/native/tsconfig.json",
  "./apps/user/tsconfig.json",
].filter((p) => fs.existsSync(p));

module.exports = [
  /**
   * 🧹 Ignore paths globally
   */
  {
    ignores: [
      "node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.next/**",
      ".history/**",
      "**/coverage/**",
      "**/*.d.ts",
      "apps/native/index.js",
      "packages/queue/**",
      "packages/queue/__tests__/index.spec.js",
    ],
  },

  /**
   * 📦 Base Expo Config
   */
  ...expoConfig,

  /**
   * 🧠 Custom Project Rules
   */
  {
    name: "project-config",
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
        tsconfigRootDir: __dirname,
        project: tsProjects, // ✅ Only existing tsconfigs
        warnOnUnsupportedTypeScriptVersion: true, // ✅ Warn instead of error
      },
    },
    rules: {
      "import/no-unresolved": ["error", { ignore: ["./libs/validation/dtos"] }],
      "react/no-unescaped-entities": "warn",
      "react/display-name": "warn",
      "react-hooks/exhaustive-deps": "warn",

      // TypeScript rules (plugin already included via Expo)
      // "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      // "@typescript-eslint/no-require-imports": "warn",

      // General JS/TS rules
      "no-undef": "off",
      "no-unused-expressions": "off",
      "no-var": "error",
      eqeqeq: "warn",
      "import/export": "warn",
    },
    settings: {
      react: {
        version: "18.3",
      },
      "import/resolver": {
        typescript: {
          project: tsProjects,
          alwaysTryTypes: true,
          noWarnOnMultipleProjects: true,
        },
      },
    },
  },

  /**
   * 🎨 Prettier Integration
   */
  {
    name: "prettier-config",
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": "warn",
       "import/no-unresolved": "warn"
    },
  },
];
