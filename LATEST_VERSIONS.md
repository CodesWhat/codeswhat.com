# Latest Versions Setup Guide

## What's Been Updated

Your project is now configured to use the latest stable and canary versions:

### Stack Versions
- **Node.js**: 20.9.0 or higher (required)
- **Next.js**: 15.3.4 (canary for Tailwind v4)
- **React**: 19 (latest stable)
- **Tailwind CSS**: v4 (via canary)
- **shadcn/ui**: canary release (for Tailwind v4 support)

### Key Changes Made

1. **Cursor Rules (`.cursorrules`)**
   - Updated to use `npx shadcn@canary` commands
   - Added Tailwind v4 specific features
   - Included Node.js 20+ requirement
   - Added upgrade instructions

2. **Start Script (`start.sh`)**
   - Updated Node.js requirement to v20
   - Changed from "Home Lab" to generic project naming
   - Added nvm hints for Node.js installation
   - Updated environment variables for blog/portfolio

## Quick Start

### 1. Ensure Node.js 20+ is installed
```bash
# Check your version
node -v

# If needed, install with nvm
nvm install 20.9.0
nvm use 20.9.0
```

### 2. Create New Project
```bash
# Create frontend directory and project
mkdir frontend && cd frontend

# Create Next.js app with latest canary (for Tailwind v4)
npx create-next-app@canary . --tailwind --typescript --eslint --app --no-src-dir

# Initialize shadcn/ui with Tailwind v4 support
npx shadcn@canary init

# Add components
npx shadcn@canary add button card form
```

### 3. Run Development Server
```bash
# From project root (not frontend)
./start.sh
```

## Important Notes

### About Canary Releases
- `@canary` releases are pre-release versions with latest features
- They're stable enough for production but may have minor issues
- If you encounter problems, you can fall back to stable:
  ```bash
  npx create-next-app@latest  # Instead of @canary
  npx shadcn@latest init      # Instead of @canary
  ```

### Tailwind v4 Benefits
- **Faster builds**: No PostCSS required
- **Smaller CSS**: Better tree-shaking
- **Native features**: CSS cascade layers, container queries
- **Better DX**: CSS-first configuration

### shadcn/ui Benefits
- **Code ownership**: Components live in your codebase
- **Full customization**: Direct code editing
- **No lock-in**: Not a traditional dependency
- **Tree-shaking**: Only ship what you use

## Troubleshooting

### If npm/npx commands fail
```bash
# Clear npm cache
npm cache clean --force

# Update npm
npm install -g npm@latest
```

### If Tailwind v4 has issues
```bash
# Fall back to stable versions
npx create-next-app@latest my-blog --tailwind --typescript --eslint --app
npx shadcn@latest init
```

### Port 3000 already in use
The start script automatically kills existing processes, but if issues persist:
```bash
# Manually kill port 3000
lsof -ti:3000 | xargs kill -9
```

## Next Steps

1. Run `./start.sh` to start development
2. Start adding shadcn components with `npx shadcn@canary add [component]`
3. Build your blog/portfolio!
4. Deploy to Vercel when ready

Remember: The development server auto-restarts on file changes, so just save and see your updates live! 