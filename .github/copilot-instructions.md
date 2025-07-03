# GitHub Copilot Custom Instructions

## Commit Message Standards

**MANDATORY**: ALL commit messages MUST include emojis. When generating commit messages, use conventional commits with emojis for clear, semantic commit history.

### Format
`<emoji> <type>: <description>`

**IMPORTANT**: When a commit has multiple bullet points, each bullet point should start with an appropriate emoji to categorize the type of change. This is the preferred format and should be used consistently.

### Common Commit Types
- 🐛 **fix**: Bug fixes and error corrections
- ✨ **feat**: New features and functionality
- 🔧 **config**: Configuration and settings changes
- 📝 **docs**: Documentation updates
- 🎨 **style**: UI/UX and styling improvements
- ⚡ **perf**: Performance optimizations
- 🔒 **security**: Security-related changes
- 🗃️ **data**: Database and data-related changes
- 🔄 **refactor**: Code refactoring without functional changes
- 🧪 **test**: Testing additions and updates
- 🚀 **deploy**: Deployment and CI/CD changes
- 📦 **deps**: Dependency management
- 🗑️ **remove**: Code or feature removal
- 🚨 **hotfix**: Critical fixes requiring immediate attention
- 🚚 **move**: Moving or renaming files and folders
- 🔊 **logs**: Adding or improving logging
- 🏷️ **types**: Type definitions and annotations
- 🧹 **cleanup**: Code cleanup and maintenance
- 🔐 **auth**: Authentication and authorization
- 📈 **monitoring**: Metrics and observability

*Use these common types when applicable, or choose other appropriate emojis that clearly represent the change being made.*

### Multi-Type Commits (PREFERRED FORMAT)
**Always use emojis for bullet points** when a commit includes multiple changes. Each bullet point should start with the appropriate emoji:

```
🔧 fix: Address Python 3.13 compatibility issues in dependencies

- 📦 deps: Updated SQLAlchemy from 2.0.25 to 2.0.36 to resolve typing system errors
- 📦 deps: Upgraded psycopg2-binary from 2.9.9 to 2.9.10 to fix ImportError related to missing C API symbols
- 🧪 test: Confirmed compatibility of Alembic, FastAPI, and Uvicorn with Python 3.13
```

```
🔄 refactor: Improve type safety in dashboard components

- 🏷️ types: Updated type definitions across components
- 🗑️ remove: Removed unused state variables
- 🐛 fix: Improved error handling in API calls
- 🧹 cleanup: Removed commented-out code and unused imports
```

```
✨ feat: Add user authentication system

- 🔐 auth: Implemented JWT token authentication
- 🗃️ data: Added user model with encrypted passwords
- 🧪 test: Created comprehensive auth test suite
- 📝 docs: Updated API documentation with auth endpoints
```

### Guidelines
- **ALWAYS** use emojis in bullet points when there are multiple changes
- Keep descriptions concise but descriptive
- Use present tense ("add feature" not "added feature")
- Start description with lowercase letter
- No period at the end of the description
- Include scope in parentheses when helpful: `feat(api): add user endpoint`

### Single vs Multi-Type Commits
- **Single change**: Use one emoji in the title only
- **Multiple changes**: Use emoji in title + emoji for each bullet point (REQUIRED)

This makes commit messages more informative and helps readers quickly understand the different aspects of each change at a glance.

## CRITICAL REQUIREMENTS
- **NEVER** generate commit messages without emojis
- **ALWAYS** start commit titles with an appropriate emoji
- **ALWAYS** use emojis in bullet points for multi-change commits
- Use the emoji mapping table above for consistency

Always use the appropriate emoji and type to maintain consistent commit history.