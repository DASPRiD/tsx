# Line Number Accuracy Validation

This directory contains scripts and utilities for validating line number accuracy in the tsx repository.

## Scripts

### `validate-line-numbers.js`

A comprehensive validation script that verifies:

- **Hardcoded line number references** (e.g., `asdf.js:30:7` in smoke tests)
- **Dynamic line number calculations** using the sourcemap tag function
- **Complex template scenarios** with JSX and TSX files
- **Edge cases** including:
  - Multi-byte characters (UTF-8, emoji, Chinese, Japanese, Arabic)
  - Very long lines (10k+ characters)
  - Complex TypeScript syntax
  - Template literals and nested structures

**Usage:**
```bash
node scripts/validate-line-numbers.js
```

**Expected Output:**
```
🎉 All line number references are accurate!

📊 Summary:
   - Hardcoded references: ✅ Verified
   - Dynamic calculations: ✅ Working correctly
   - Edge cases: ✅ Handled properly
   - Template literals: ✅ Accurate
```

## How Line Numbers Work in tsx

The tsx repository uses a sophisticated system for testing source map accuracy:

1. **Template Literal Tags**: The `sourcemap.tag` function in `tests/fixtures.ts` dynamically calculates line numbers by:
   - Finding `SOURCEMAP_LINE` placeholders in test templates
   - Calculating the actual line number using `split('\n').findIndex()`
   - Replacing all placeholders with the correct line number

2. **Error Stack Validation**: Tests verify that error stack traces contain the expected file and line number references

3. **Source Map Integration**: The system works with esbuild's source maps to ensure transformed code maintains accurate line number reporting

## Test Files

- `tests/specs/line-number-accuracy.ts` - Comprehensive test suite for line number accuracy
- `tests/utils/line-number-test-utils.ts` - Utilities for testing edge cases and complex scenarios

## Validation Results

✅ **All existing line number references in the tsx repository are accurate and up-to-date.**

The validation covers:
- 30+ different test scenarios
- Multi-byte character handling
- Complex TypeScript and JSX syntax
- Edge cases with long lines and nested structures
- Windows (CRLF) and Unix (LF) line endings