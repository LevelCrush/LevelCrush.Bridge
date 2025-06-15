# Git Hooks

This directory contains custom git hooks for the Dynasty Trader project.

## Setup

To use these hooks, run:

```bash
git config core.hooksPath .githooks
```

## Hooks

### pre-commit

Checks for potential credential leaks before committing. The hook will prevent commits if it detects:
- Discord tokens and secrets
- API keys and secrets
- Database passwords
- JWT secrets
- AWS credentials

To bypass the check (use with caution):
```bash
git commit --no-verify
```

## Adding New Patterns

To add new patterns to check for, edit `.githooks/pre-commit` and add them to the `PATTERNS` array.