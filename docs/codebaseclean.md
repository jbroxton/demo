# Codebase Cleanup Plan

This document outlines a structured approach to cleaning up the codebase, with a primary focus on removing unused elements and a secondary focus on refactoring. This plan is designed to be executed in a systematic way that maximizes efficiency for LLM-assisted cleanup.

## Objectives

1. **Primary Objective**: Remove all unused files, functions, imports, variables, and code
2. **Secondary Objective**: Refactor the app to follow established patterns in CLAUDE.md

## Analysis Phase

### 1. Dependency Graph Generation

**Task**: Create a dependency graph of the entire codebase to trace imports and usage
- Use static analysis to map relationships between files
- Identify entry points and trace dependencies
- Generate a visual representation of the dependency tree

```typescript
// Sample structure of dependency data
{
  "filename": "/src/components/example.tsx",
  "imports": [
    { "name": "useState", "from": "react", "used": true },
    { "name": "Button", "from": "@/components/ui/button", "used": true },
    { "name": "formatDate", "from": "@/utils/date", "used": false }
  ],
  "exports": [
    { "name": "ExampleComponent", "importedBy": ["/src/app/page.tsx"] },
    { "name": "helperFunction", "importedBy": [] }
  ]
}
```

### 2. Dead Code Identification

**Task**: Create a comprehensive inventory of potentially unused code
- **Files**: Identify files not imported anywhere or only in test files
- **Functions**: Identify exported functions/components never imported
- **Imports**: Identify imports that are never used in the file
- **Variables**: Identify declared variables never referenced
- **Dead branches**: Identify conditional branches that can never execute

## Cleanup Implementation

### Stage 1: Unused Import Removal

**Priority**: High
**Complexity**: Low
**Risk**: Low

**Process**:
1. For each file, analyze imports and their usage within the file
2. Remove or comment out unused imports
3. Run tests to verify no regressions
4. Commit changes with clear message about import cleanup

**LLM-optimized approach**:
- Process files in batches by directory
- Use regex patterns to identify imports and their usage
- Generate before/after diffs for verification

**Example**:
```typescript
// BEFORE
import { useState, useEffect, useRef, useMemo } from 'react';
import { Button, Card } from '@/components/ui';
import { formatDate, formatTime } from '@/utils/date';

// Component only uses useState and Button
function ExampleComponent() {
  const [value, setValue] = useState(0);
  
  return <Button onClick={() => setValue(value + 1)}>{value}</Button>;
}

// AFTER
import { useState } from 'react';
import { Button } from '@/components/ui';

function ExampleComponent() {
  const [value, setValue] = useState(0);
  
  return <Button onClick={() => setValue(value + 1)}>{value}</Button>;
}
```

### Stage 2: Unused Function/Method Removal

**Priority**: High
**Complexity**: Medium
**Risk**: Medium

**Process**:
1. For each file, identify exported functions/methods with no imports
2. For each file, identify private functions/methods never called within the file
3. Remove or comment out unused functions
4. Run tests to verify no regressions
5. Commit changes with clear message about function cleanup

**LLM-optimized approach**:
- Group functions by file and similarity
- Check for dynamic usage patterns (e.g., `[functionName]()` calls)
- Prioritize simpler files with fewer dependencies first

**Example**:
```typescript
// BEFORE
export function usedFunction() {
  return 'This is used';
}

export function unusedFunction() {
  return 'This is never imported';
}

function usedHelperFunction() {
  return 'This is called internally';
}

function unusedHelperFunction() {
  return 'This is never called';
}

export function mainFunction() {
  return usedHelperFunction();
}

// AFTER
export function usedFunction() {
  return 'This is used';
}

function usedHelperFunction() {
  return 'This is called internally';
}

export function mainFunction() {
  return usedHelperFunction();
}
```

### Stage 3: Unused File Removal

**Priority**: High
**Complexity**: Medium
**Risk**: Medium-High

**Process**:
1. Identify files not imported anywhere in the codebase
2. Verify files are not used through dynamic imports or require
3. Verify files are not referenced in package.json or build configs
4. Remove confirmed unused files
5. Run tests to verify no regressions
6. Commit changes with clear message about file cleanup

**LLM-optimized approach**:
- Batch files by directory and type
- Create removal candidate list with confidence scores
- Start with files having highest confidence of being unused

**Example removal candidates**:
```
1. /src/utils/deprecated-util.ts (Confidence: High - No imports found)
2. /src/components/unused-component.tsx (Confidence: High - No imports found)
3. /src/hooks/use-experimental-feature.ts (Confidence: Medium - Only imported in test files)
```

### Stage 4: Unused Variables and Parameters Removal

**Priority**: Medium
**Complexity**: Medium
**Risk**: Low

**Process**:
1. Identify variables defined but never used
2. Identify function parameters never referenced in function body
3. Remove unused variables and parameters
4. Run tests to verify no regressions
5. Commit changes with clear message about variable cleanup

**LLM-optimized approach**:
- Use TypeScript compiler API to identify unused variables
- Start with non-destructured variables for simpler analysis
- Handle destructured objects with special care (partial usage)

**Example**:
```typescript
// BEFORE
function processData(data, options, callback) {
  const { id, name, description, timestamp } = data;
  const processed = { id, name };
  
  return processed;
}

// AFTER
function processData(data) {
  const { id, name } = data;
  const processed = { id, name };
  
  return processed;
}
```

### Stage 5: Dead Branch Elimination

**Priority**: Medium
**Complexity**: High
**Risk**: Medium

**Process**:
1. Identify conditional branches that can never execute
2. Identify unreachable code blocks
3. Remove dead branches after careful analysis
4. Run tests to verify no regressions
5. Commit changes with clear message about branch cleanup

**LLM-optimized approach**:
- Focus on simple cases with constants or simple expressions
- Flag complex cases for human review
- Preserve commented code that might contain valuable logic

**Example**:
```typescript
// BEFORE
function processValue(value) {
  if (value > 0) {
    return 'positive';
  } else if (value < 0) {
    return 'negative';
  } else if (value === 0) {
    return 'zero';
  } else {
    // This branch can never execute since all number cases are covered
    return 'unknown';
  }
}

// AFTER
function processValue(value) {
  if (value > 0) {
    return 'positive';
  } else if (value < 0) {
    return 'negative';
  } else {
    return 'zero'; // value === 0
  }
}
```

### Stage 6: Commented Code Removal

**Priority**: Low
**Complexity**: Low
**Risk**: Low

**Process**:
1. Identify blocks of commented code (not documentation)
2. Remove commented code blocks
3. Commit changes with clear message about commented code cleanup

**LLM-optimized approach**:
- Distinguish between documentation comments and commented code
- Remove larger blocks first
- Preserve comments that explain adjacent code

**Example**:
```typescript
// BEFORE
function calculateTotal(items) {
  // Old implementation
  // let total = 0;
  // for (let i = 0; i < items.length; i++) {
  //   total += items[i].price * items[i].quantity;
  // }
  // return total;
  
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// AFTER
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
```

## Execution Strategy for LLM

To maximize LLM efficiency, structure the cleanup process as follows:

### 1. File Analysis Tools

**Task**: Use these tools to analyze the codebase
- **Dependency Mapping**: Generate dependency trees from entry points
- **Import Analysis**: Static analysis of import usage
- **Regex Pattern Matching**: Identify function declarations and usage
- **AST Analysis**: Parse TypeScript AST to identify code structure

### 2. Batch Processing

**Task**: Process cleanup in these batches
1. **Batch by Directory**: Process one directory at a time
2. **Batch by File Type**: Group similar files (components, hooks, utils)
3. **Batch by Complexity**: Start with simpler files, then progress to complex ones

### 3. Verification Checkpoints

Include these verification steps between cleanup stages:
1. **Run Tests**: Ensure tests still pass
2. **Build Application**: Verify application still builds
3. **Visual Regression**: Quick check of key pages/components
4. **Incremental Commits**: Small, focused commits with clear messages

## LLM-Optimized Commands

Here are commands an LLM can use to execute the plan effectively:

### File Analysis Commands

```bash
# Find all typescript files
find src -type f -name "*.ts" -o -name "*.tsx" | sort

# Check imports for a file
grep -n "import " src/components/example.tsx

# Find usages of a component or function
grep -r "ExampleComponent" --include="*.tsx" src/

# Find potentially dead files (not imported anywhere)
for file in $(find src -type f -name "*.ts" -o -name "*.tsx"); do
  filename=$(basename $file | cut -d. -f1)
  if ! grep -q "from ['\"].*$filename['\"]" $(find src -type f -name "*.ts" -o -name "*.tsx"); then
    echo "Potentially unused: $file"
  fi
done
```

### Code Analysis Script Template

```javascript
// Script to analyze imports and their usage
const ts = require('typescript');
const fs = require('fs');

function analyzeFile(filePath) {
  const sourceText = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true
  );
  
  const imports = [];
  const exports = [];
  const usedIdentifiers = new Set();
  
  // Traverse AST to find imports, exports, and used identifiers
  // ...implementation details...
  
  return {
    filePath,
    imports,
    exports,
    usedIdentifiers,
    unusedImports: imports.filter(imp => !usedIdentifiers.has(imp.name))
  };
}
```

## Step-by-Step LLM Execution Plan

1. **Initial Setup**
   - Generate a list of all TypeScript files
   - Sort by directory and file type
   - Prioritize based on file size and complexity

2. **Batch 1: Analysis**
   - For each directory, analyze imports and exports
   - Generate dependency graph
   - Identify potential dead code

3. **Batch 2: Import Cleanup**
   - For each file, remove unused imports
   - Commit changes per directory

4. **Batch 3: Function Cleanup**
   - Remove unused private functions
   - Remove unused exported functions
   - Commit changes per directory

5. **Batch 4: File Cleanup**
   - Remove confirmed unused files
   - Update any references
   - Commit changes per directory

6. **Batch 5: Variable Cleanup**
   - Remove unused variables and parameters
   - Commit changes per directory

7. **Batch 6: Branch Cleanup**
   - Remove dead code branches
   - Commit changes per directory

8. **Batch 7: Commented Code Cleanup**
   - Remove obsolete commented code
   - Commit changes per directory

## Success Metrics

Track the following metrics to measure cleanup success:

1. **Files Removed**: Number of unused files removed
2. **Functions Removed**: Number of unused functions removed
3. **Imports Removed**: Number of unused imports removed
4. **Lines of Code Reduced**: Total lines removed
5. **Build Size Reduction**: Reduction in compiled bundle size
6. **Build Time Improvement**: Reduction in build time

## Conclusion

This plan provides a systematic approach to codebase cleanup with LLM assistance. By following these structured steps and focusing on clear, discrete tasks, the cleanup process can be executed efficiently and safely.

The approach prioritizes:
1. Low-risk, high-impact changes first (removing unused imports)
2. Systematic analysis before removal
3. Regular verification to prevent regressions
4. Clear documentation of what was removed and why

Remember that automated cleanup should always be followed by comprehensive testing to ensure no regressions are introduced. Critical paths in the application should be manually verified after significant changes.