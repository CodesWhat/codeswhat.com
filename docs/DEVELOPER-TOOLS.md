# Developer Tools & Setup Guide

## Code Quality Tools (Already Set Up)

### Running Linters & Formatters

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

## Global Developer Tools with pipx

### What is pipx?
pipx lets you install Python CLI applications globally in isolated environments, preventing dependency conflicts.

### Recommended Tools to Install

#### 1. **httpie** - Modern HTTP client
```bash
pipx install httpie

# Usage:
http GET api.github.com/users/github
http POST httpbin.org/post name='John' age:=29
```

#### 2. **black** - Python code formatter
```bash
pipx install black

# Usage:
black myfile.py
black .  # Format all Python files
```

#### 3. **poetry** - Python dependency management
```bash
pipx install poetry

# Usage:
poetry new my-project
poetry add requests
poetry install
```

#### 4. **pre-commit** - Git hook management
```bash
pipx install pre-commit

# Usage in a project:
pre-commit install
pre-commit run --all-files
```

#### 5. **cookiecutter** - Project templates
```bash
pipx install cookiecutter

# Usage:
cookiecutter gh:audreyr/cookiecutter-pypackage
```

#### 6. **youtube-dl** / **yt-dlp** - Download videos
```bash
pipx install yt-dlp

# Usage:
yt-dlp "https://www.youtube.com/watch?v=..."
```

#### 7. **tldr** - Simplified man pages
```bash
pipx install tldr

# Usage:
tldr git
tldr docker
```

#### 8. **aws-cli** - AWS command line
```bash
pipx install awscli

# Usage:
aws configure
aws s3 ls
```

#### 9. **glances** - System monitoring
```bash
pipx install glances

# Usage:
glances  # Launch system monitor
```

#### 10. **mkdocs** - Documentation generator
```bash
pipx install mkdocs

# Usage:
mkdocs new my-project
mkdocs serve
mkdocs build
```

### Managing pipx Installations

```bash
# List all installed packages
pipx list

# Update a package
pipx upgrade httpie

# Update all packages
pipx upgrade-all

# Uninstall a package
pipx uninstall httpie

# Install specific version
pipx install black==22.12.0

# Install from git
pipx install git+https://github.com/user/repo.git
```

### pipx Environment

```bash
# Check pipx environment
pipx environment

# Ensure pipx is in PATH
pipx ensurepath

# Reinstall all packages (after Python upgrade)
pipx reinstall-all
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

## Quick Development Commands

```bash
# Start development
cd frontend && npm run dev

# Check everything before committing
cd frontend && npm run check:all

# Fix all auto-fixable issues
cd frontend && npm run lint:fix && npm run format

# Build for production
cd frontend && npm run build

# Test production build locally
cd frontend && npm run build && npm run start
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