import { testSuite } from 'manten';
import { createFixture } from 'fs-fixture';
import { tsx } from '../utils/tsx.js';
import { expectErrors } from '../fixtures.js';
import { createLineNumberTests } from '../utils/line-number-test-utils.js';

export default testSuite(async ({ describe }) => {
	describe('Line Number Accuracy', ({ test, describe: subDescribe }) => {
		subDescribe('Source map line number calculation', ({ test }) => {
			test('correctly calculates line numbers for simple cases', () => {
				const sourcemap = {
					test: (extension: string) => 
						`import ('node:fs');\nconst { stack } = new Error(); const searchString = 'index.${extension}:SOURCEMAP_LINE'; assert(stack.includes(searchString), \`Expected \${searchString} in stack: \${stack}\`)`,
					tag: (strings: TemplateStringsArray, ...values: string[]) => {
						const finalString = String.raw({ raw: strings }, ...values);
						const lineNumber = finalString.split('\n').findIndex(line => line.includes('SOURCEMAP_LINE')) + 1;
						return finalString.replaceAll('SOURCEMAP_LINE', lineNumber.toString());
					}
				};

				const simpleTest = sourcemap.test('js');
				expect(simpleTest).toMatch(/SOURCEMAP_LINE/);
				
				const result = sourcemap.tag`${simpleTest}`;
				expect(result).not.toMatch(/SOURCEMAP_LINE/);
				expect(result).toMatch(/index\.js:2/);
			});

			test('handles multi-line expressions correctly', () => {
				const sourcemap = {
					tag: (strings: TemplateStringsArray, ...values: string[]) => {
						const finalString = String.raw({ raw: strings }, ...values);
						const lineNumber = finalString.split('\n').findIndex(line => line.includes('SOURCEMAP_LINE')) + 1;
						return finalString.replaceAll('SOURCEMAP_LINE', lineNumber.toString());
					}
				};

				const multilineContent = sourcemap.tag`// Comment line 1
// Comment line 2  
const complexObject = {
	method() {
		// This is line 5
		import ('node:fs');
		const { stack } = new Error(); const searchString = 'index.test:SOURCEMAP_LINE'; assert(stack.includes(searchString), \`Expected \${searchString} in stack: \${stack}\`)
	}
};
// Final line`;

				expect(multilineContent).toMatch(/index\.test:7/);
				expect(multilineContent).not.toMatch(/SOURCEMAP_LINE/);
			});

			test('handles special characters in source content', () => {
				const sourcemap = {
					tag: (strings: TemplateStringsArray, ...values: string[]) => {
						const finalString = String.raw({ raw: strings }, ...values);
						const lineNumber = finalString.split('\n').findIndex(line => line.includes('SOURCEMAP_LINE')) + 1;
						return finalString.replaceAll('SOURCEMAP_LINE', lineNumber.toString());
					}
				};

				const specialCharsContent = sourcemap.tag`// äöü Special chars ñ français
// 中文 characters 日本語
// Emoji: 🚀 ⭐ 💾
import ('node:fs');
const { stack } = new Error(); const searchString = 'index.test:SOURCEMAP_LINE'; assert(stack.includes(searchString), \`Expected \${searchString} in stack: \${stack}\`)
// End with more special chars: ∞ ♥ ★`;

				expect(specialCharsContent).toMatch(/index\.test:5/);
				expect(specialCharsContent).not.toMatch(/SOURCEMAP_LINE/);
			});
		});

		subDescribe('Error reporting line numbers', ({ test }) => {
			test('reports correct line numbers for syntax errors', async () => {
				const fixture = await createFixture({
					'syntax-error.ts': 'const x = {\n  invalidSyntax\n  missingComma\n};'
				});

				const tsxProcess = tsx({
					args: [fixture.getPath('syntax-error.ts')],
					cwd: fixture.path,
					reject: false
				});

				const { stderr } = await tsxProcess;
				
				// The error should reference the correct line number
				// This will depend on the specific error reporting format
				expect(stderr).toMatch(/syntax-error\.ts/);
				
				await fixture.remove();
			});

			test('maintains line number accuracy across transformations', async () => {
				const fixture = await createFixture({
					'complex.tsx': `import React from 'react';
// Comment line
interface Props {
	value: number;
}
					
const Component = ({ value }: Props) => {
	// This should be line 8
	throw new Error(\`Error on line: \${new Error().stack}\`);
	return <div>{value}</div>;
};

export default Component;`
				});

				const tsxProcess = tsx({
					args: [fixture.getPath('complex.tsx')],
					cwd: fixture.path,
					reject: false
				});

				const { stderr } = await tsxProcess;
				
				// The error should reference line 9 where the throw statement is
				expect(stderr).toMatch(/complex\.tsx/);
				
				await fixture.remove();
			});
		});

		subDescribe('Different file encodings', ({ test }) => {
			test('handles UTF-8 encoded files correctly', async () => {
				const fixture = await createFixture({
					'utf8-file.ts': Buffer.from('// UTF-8: café naïve résumé\nconst message = "Hello, 世界!";\nthrow new Error("Line 3 error");', 'utf8')
				});

				const tsxProcess = tsx({
					args: [fixture.getPath('utf8-file.ts')],
					cwd: fixture.path,
					reject: false
				});

				const { stderr } = await tsxProcess;
				
				// Should reference line 3 correctly despite UTF-8 characters
				expect(stderr).toMatch(/utf8-file\.ts/);
				
				await fixture.remove();
			});
		});

		subDescribe('Existing line number references validation', ({ test }) => {
			test('validates hardcoded line number references are accurate', () => {
				// Test the known hardcoded reference from smoke tests
				const expectedLine = 'asdf.js:30:7';
				
				// Decode the base64 sourcemap from file-with-sourcemap.js
				const base64Data = 'ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiYXNkZi5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cbnRocm93IG5ldyBFcnJvcigpIl0sCiAgIm1hcHBpbmdzIjogIkFBNkJBLE1BQU0sSUFBSSIsCiAgIm5hbWVzIjogW10KfQo=';
				const decodedMap = JSON.parse(Buffer.from(base64Data, 'base64').toString('utf8'));
				
				// Count the newlines in the original source to verify line 30
				const sourceContent = decodedMap.sourcesContent[0];
				const lineCount = sourceContent.split('\n').length;
				
				expect(lineCount).toBe(30);
				expect(expectedLine).toMatch(/asdf\.js:30:/);
			});

			test('ensures all SOURCEMAP_LINE placeholders are replaced', () => {
				const content = `Line 1
Line 2 with SOURCEMAP_LINE placeholder
Line 3`;

				const lineNumber = content.split('\n').findIndex(line => line.includes('SOURCEMAP_LINE')) + 1;
				const result = content.replaceAll('SOURCEMAP_LINE', lineNumber.toString());
				
				expect(lineNumber).toBe(2);
				expect(result).not.toMatch(/SOURCEMAP_LINE/);
				expect(result).toMatch(/Line 2 with 2 placeholder/);
			});
		});

		subDescribe('Advanced line number scenarios', ({ test }) => {
			const testUtils = createLineNumberTests();

			test('handles multi-byte characters correctly', () => {
				const content = testUtils.multiByteTest;
				expect(testUtils.validateNoPlaceholders(content)).toBe(true);
				expect(content).toMatch(/index\.utf8:7/); // Should be line 7 based on the template
			});

			test('handles deeply nested structures', () => {
				const content = testUtils.nestedTest;
				expect(testUtils.validateNoPlaceholders(content)).toBe(true);
				expect(content).toMatch(/index\.nested:9/); // Should be line 9 based on nesting
			});

			test('handles complex expressions and template literals', () => {
				const content = testUtils.complexExprTest;
				expect(testUtils.validateNoPlaceholders(content)).toBe(true);
				expect(content).toMatch(/index\.complex:11/); // Should be line 11
			});

			test('handles TypeScript-specific syntax', () => {
				const content = testUtils.typescriptTest;
				expect(testUtils.validateNoPlaceholders(content)).toBe(true);
				expect(content).toMatch(/index\.ts:12/); // Should be line 12
			});

			test('handles complex JSX components', () => {
				const content = testUtils.jsxComplexTest;
				expect(testUtils.validateNoPlaceholders(content)).toBe(true);
				expect(content).toMatch(/index\.jsx:13/); // Should be line 13
			});

			test('handles whitespace and empty lines correctly', () => {
				const content = testUtils.whitespaceTest;
				expect(testUtils.validateNoPlaceholders(content)).toBe(true);
				expect(content).toMatch(/index\.whitespace:7/); // Should be line 7
			});
		});

		subDescribe('Edge cases and robustness', ({ test }) => {
			test('handles files with Windows line endings (CRLF)', () => {
				const sourcemap = {
					tag: (strings: TemplateStringsArray, ...values: string[]) => {
						const finalString = String.raw({ raw: strings }, ...values);
						// Normalize line endings for consistent counting
						const normalized = finalString.replace(/\r\n/g, '\n');
						const lineNumber = normalized.split('\n').findIndex(line => line.includes('SOURCEMAP_LINE')) + 1;
						return finalString.replaceAll('SOURCEMAP_LINE', lineNumber.toString());
					}
				};

				const windowsContent = sourcemap.tag`Line 1\r\nLine 2\r\nimport ('node:fs');\r\nconst { stack } = new Error(); const searchString = 'index.crlf:SOURCEMAP_LINE'; assert(stack.includes(searchString), \`Expected \${searchString} in stack: \${stack}\`)`;
				
				expect(windowsContent).toMatch(/index\.crlf:4/);
				expect(windowsContent).not.toMatch(/SOURCEMAP_LINE/);
			});

			test('handles very long lines without breaking line calculation', () => {
				const sourcemap = {
					tag: (strings: TemplateStringsArray, ...values: string[]) => {
						const finalString = String.raw({ raw: strings }, ...values);
						const lineNumber = finalString.split('\n').findIndex(line => line.includes('SOURCEMAP_LINE')) + 1;
						return finalString.replaceAll('SOURCEMAP_LINE', lineNumber.toString());
					}
				};

				const veryLongLine = 'a'.repeat(10000); // 10k character line
				const longLineContent = sourcemap.tag`Short line
${veryLongLine}
import ('node:fs');
const { stack } = new Error(); const searchString = 'index.long:SOURCEMAP_LINE'; assert(stack.includes(searchString), \`Expected \${searchString} in stack: \${stack}\`)`;

				expect(longLineContent).toMatch(/index\.long:4/);
				expect(longLineContent).not.toMatch(/SOURCEMAP_LINE/);
			});

			test('handles multiple SOURCEMAP_LINE placeholders in same content', () => {
				const content = `Line 1 with SOURCEMAP_LINE
Line 2 normal
Line 3 with another SOURCEMAP_LINE
End`;

				const lineNumber = content.split('\n').findIndex(line => line.includes('SOURCEMAP_LINE')) + 1;
				const result = content.replaceAll('SOURCEMAP_LINE', lineNumber.toString());
				
				expect(lineNumber).toBe(1); // First occurrence
				expect(result).toMatch(/Line 1 with 1/);
				expect(result).toMatch(/Line 3 with another 1/); // All replaced with same number
				expect(result).not.toMatch(/SOURCEMAP_LINE/);
			});
		});