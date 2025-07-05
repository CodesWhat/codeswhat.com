# Linting 101 - Complete Guide

Welcome to the Linting 101 documentation! This folder contains everything you need to know about code quality, linting, and formatting in the CodesWhat project.

## 📚 Documentation Structure

### Core Documentation
- **[LINT_COMMANDS.md](./LINT_COMMANDS.md)** - Quick reference for all linting and formatting commands
- **[LINTING-SETUP.md](./LINTING-SETUP.md)** - Complete setup guide including VS Code configuration and troubleshooting

### Configuration Files (Reference)
- **[eslint.config.mjs](./eslint.config.mjs)** - ESLint configuration
- **[.prettierrc](./.prettierrc)** - Prettier formatting rules
- **[.prettierignore](./.prettierignore)** - Files excluded from Prettier formatting

## 🚀 Quick Start

```bash
# Navigate to frontend
cd frontend

# Run all checks (ESLint + TypeScript + Prettier)
npm run check:all

# Auto-fix issues
npm run lint:fix && npm run format
```

## 🛠️ Available Commands

| Command | Description |
|---------|-------------|
| `npm run check` | Run ESLint + TypeScript checking |
| `npm run check:all` | Run ESLint + TypeScript + Prettier check |
| `npm run lint` | Check for ESLint errors |
| `npm run lint:fix` | Auto-fix ESLint errors |
| `npm run type-check` | TypeScript type checking |
| `npm run format` | Format all files with Prettier |
| `npm run format:check` | Check if files need formatting |

## 📖 What's Included

### 1. ESLint
- JavaScript/TypeScript linting
- Next.js specific rules
- Auto-fixable issues
- Integration with VS Code

### 2. Prettier
- Code formatting
- Consistent style
- Works with Tailwind CSS
- Format on save in VS Code

### 3. TypeScript
- Type checking
- Strict mode enabled
- Better IntelliSense
- Catch errors early

## 🔧 VS Code Setup

For the best experience, install these extensions:
1. ESLint - `dbaeumer.vscode-eslint`
2. Prettier - `esbenp.prettier-vscode`
3. Tailwind CSS IntelliSense - `bradlc.vscode-tailwindcss`

See [LINTING-SETUP.md](./LINTING-SETUP.md) for complete VS Code configuration.

## 📋 Pre-commit Workflow

Before committing code:
```bash
# 1. Check everything
npm run check:all

# 2. If there are issues, fix them
npm run lint:fix && npm run format

# 3. Check again
npm run check:all

# 4. Commit your changes
git add -A && git commit -m "your message"
```

## 🎯 Best Practices

1. **Always run checks before committing** - Use `npm run check:all`
2. **Enable format on save** - Let VS Code handle formatting automatically
3. **Fix linting errors immediately** - Don't let them accumulate
4. **Understand the rules** - Don't just disable warnings without understanding why
5. **Keep configs in sync** - If you modify linting rules, document the changes

## 🆘 Need Help?

- Check [LINTING-SETUP.md](./LINTING-SETUP.md) for troubleshooting tips
- Review the configuration files in this folder
- Run `npm run lint -- --help` for ESLint options
- Run `npx prettier --help` for Prettier options

## 📊 Current Configuration

### ESLint
- Extends: `next/core-web-vitals`, `next/typescript`
- Parser: TypeScript ESLint parser
- Environment: Browser, Node.js, ES2021

### Prettier
- Semi: false (no semicolons)
- Single quotes: true
- Tab width: 2
- Trailing comma: ES5
- Print width: 100
- Tailwind CSS plugin enabled

### TypeScript
- Strict mode: enabled
- Target: ES2017
- Module: ESNext
- JSX: Preserve

---

Remember: Good linting practices lead to cleaner, more maintainable code! 🚀 