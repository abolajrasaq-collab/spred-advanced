# Git Workflow Guide for Spred Android App

## Branch Strategy

### Main Branches
- **`main`** - Production-ready code, stable releases only
- **`develop`** - Integration branch for features, main development branch

### Feature Branches
- **`feature/p2p-implementation`** - P2P file transfer functionality
- **`feature/ui-enhancements`** - UI/UX improvements and new components
- **`feature/performance-optimization`** - Performance improvements and optimizations
- **`feature/testing-setup`** - Testing infrastructure and test cases

### Additional Branches (Create as needed)
- **`hotfix/`** - Critical bug fixes for production (e.g., `hotfix/crash-fix`)
- **`release/`** - Release preparation (e.g., `release/v1.2.0`)
- **`docs/`** - Documentation updates

## Workflow Process

### 1. Starting New Work
```bash
# Switch to develop branch
git checkout develop
git pull origin develop

# Create new feature branch
git checkout -b feature/your-feature-name
```

### 2. Daily Development
```bash
# Make your changes
git add .
git commit -m "feat: descriptive commit message"

# Push to remote
git push origin feature/your-feature-name
```

### 3. Merging Features
```bash
# Switch to develop
git checkout develop
git pull origin develop

# Merge feature branch
git merge feature/your-feature-name

# Push to develop
git push origin develop

# Delete feature branch (optional)
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

### 4. Creating Releases
```bash
# Create release branch from develop
git checkout -b release/v1.2.0 develop

# Make final adjustments, update version numbers
# Test thoroughly

# Merge to main
git checkout main
git merge release/v1.2.0
git tag -a v1.2.0 -m "Release version 1.2.0"
git push origin main --tags

# Merge back to develop
git checkout develop
git merge release/v1.2.0
git push origin develop
```

## Commit Message Convention

Use conventional commits format:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```bash
git commit -m "feat: add P2P file transfer functionality"
git commit -m "fix: resolve Metro bundler dependency issue"
git commit -m "docs: update README with installation guide"
```

## Current Branch Status

### Active Branches
- ✅ `main` - Production branch
- ✅ `develop` - Development integration branch
- ✅ `feature/p2p-implementation` - P2P functionality
- ✅ `feature/ui-enhancements` - UI improvements
- ✅ `feature/performance-optimization` - Performance work
- ✅ `feature/testing-setup` - Testing infrastructure

## Best Practices

1. **Always pull before starting work**
2. **Keep commits small and focused**
3. **Write descriptive commit messages**
4. **Test before merging to develop**
5. **Use pull requests for code review**
6. **Never commit directly to main**
7. **Keep feature branches up to date with develop**

## Quick Commands

```bash
# Check current status
git status

# View all branches
git branch -a

# Switch to branch
git checkout branch-name

# Create and switch to new branch
git checkout -b new-branch-name

# View commit history
git log --oneline -10

# View changes
git diff

# Stash changes
git stash
git stash pop
```

## Emergency Procedures

### Hotfix Process
```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-fix

# Make fix, commit, and merge
git add .
git commit -m "fix: critical issue description"
git checkout main
git merge hotfix/critical-fix
git push origin main

# Merge back to develop
git checkout develop
git merge hotfix/critical-fix
git push origin develop
```

### Resolving Merge Conflicts
```bash
# When conflicts occur during merge
git status  # See conflicted files
# Edit files to resolve conflicts
git add resolved-file.txt
git commit -m "resolve: merge conflict in file.txt"
```

## Repository URLs
- **Remote Origin**: https://github.com/abolajrasaq-collab/spred-android8.git
- **Main Branch**: `origin/main`
- **Develop Branch**: `origin/develop`
