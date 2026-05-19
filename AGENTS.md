# 🤖 Game Framework AI Agent System

## Overview

This document describes the AI agent capabilities available for working with the TypeScript game framework project. Agents can help with code generation, refactoring, testing, documentation, and optimization tasks.

## Agent Tasks & Capabilities

### Code Generation

Agents can generate:

- New classes extending `Game` base class
- Utility functions and helper methods
- Canvas drawing functions following existing patterns
- TypeScript type definitions
- Test files with appropriate setup

### Refactoring

Agents can refactor:

- Extract common code into utility functions
- Improve type safety and add missing types
- Convert between ES6 and CommonJS syntax
- Optimize event listener management
- Simplify complex expressions

### Debugging & Bug Fixes

Agents can help with:

- Fixing TypeScript compilation errors
- Resolving runtime JavaScript errors
- Identifying memory leaks in game loops
- Fixing canvas rendering issues
- Correcting type mismatches

### Documentation

Agents can create:

- JSDoc comments for functions and classes
- README files for new modules
- API documentation for public methods
- Migration guides for code changes

### Testing

Agents can write:

- Unit tests for game mechanics
- Canvas rendering verification tests
- Event system testing utilities
- Mock objects for dependency injection

## Best Practices

### File Modification Workflow

```plain
1. read_file(filepath="...")           # Always read current file state
2. Analyze changes needed              # Plan modifications
3. Present Analysis to User            # Wait for response
3. edit_existing_file()                # Apply changes with edit tool
4. view_diff()                         # Verify diff before commit
```

### Type Safety

Always ensure:

- TypeScript types are properly inferred or annotated
- No implicit `any` types unless necessary
- Consistent use of the framework's type definitions from `index.d.ts`

### Run `./build.sh` after each major change

This ensures made changes dont have issues and are tested.

### Never Implement Without Explicit Confirmation

### What NOT to Do ❌

- **DO NOT** implement fixes mid-conversation when asked to just list/analyze
- **DO NOT** modify files after providing a complete analysis without being asked
- **DO NOT** "helpfully" fix multiple issues before user confirms
- **ALWAYS** wait for explicit trigger: "go ahead", "implement these", "do it", "apply fixes"

### Correct Workflow ✅

**User asks:** "list all `as any` usages and how I would solve them"

**I should:**

1. ✅ Find ALL instances first
2. ✅ Present complete analysis table (severity + proposed solutions)
3. ✅ WAIT and ask: "Would you like me to implement these fixes now?"
4. ❌ Never edit files until user gives explicit permission

### Triggers That Allow Implementation

User explicitly says one of:

- `"go ahead"` or `"proceed"` or `"do it"`
- `"apply the fix(es)"` or `"implement"`
- `"make the changes"` or `"fix it"`
- `"update the code"` or `"edit these files"`
