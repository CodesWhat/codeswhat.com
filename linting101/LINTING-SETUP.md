# Linting & Code Quality Setup

## Running Linters & Formatters

```bash
# Navigate to frontend
cd frontend

# Run all checks at once (recommended before committing)
npm run check:all

# Individual commands:
npm run lint          # ESLint only
npm run lint:fix      # ESLint with auto-fix
npm run type-check    # TypeScript type checking
npm run format        # Prettier format all files
npm run format:check  # Check if files are formatted

# Quick command before pushing:
npm run check:all && git add -A && git commit -m "your message"
```

## VS Code Extensions for Better Linting

Recommended extensions for this project:
1. **ESLint** - `dbaeumer.vscode-eslint`
2. **Prettier** - `esbenp.prettier-vscode`
3. **TypeScript** - Built-in
4. **Tailwind CSS IntelliSense** - `bradlc.vscode-tailwindcss`

### VS Code Settings

Add to `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"],
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

## Pre-commit Hook Setup (Optional)

To ensure code quality before every commit:

```bash
# Install pre-commit
pipx install pre-commit

# Create .pre-commit-config.yaml in project root
cat > .pre-commit-config.yaml << 'EOF'
repos:
  - repo: local
    hooks:
      - id: npm-check
        name: npm check
        entry: bash -c 'cd frontend && npm run check:all'
        language: system
        pass_filenames: false
        always_run: true
EOF

# Install the git hook
pre-commit install

# Test it
pre-commit run --all-files
```

## Troubleshooting

### ESLint not working?
```bash
cd frontend
rm -rf node_modules .next
npm install
npm run lint
```

### Prettier conflicts with ESLint?
The project is configured to handle this, but if issues arise:
```bash
# Format with Prettier first
npm run format

# Then run ESLint
npm run lint:fix
```

### TypeScript errors not showing?
```bash
# Restart TS server in VS Code
Cmd+Shift+P -> "TypeScript: Restart TS Server"

# Or manually check
npm run type-check
``` 