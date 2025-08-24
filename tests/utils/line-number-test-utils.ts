/**
 * Enhanced test utilities for line number accuracy testing
 */

export const createLineNumberTests = () => {
	const sourcemap = {
		test: (extension: string) => 
			`import ('node:fs');\nconst { stack } = new Error(); const searchString = 'index.${extension}:SOURCEMAP_LINE'; assert(stack.includes(searchString), \`Expected \${searchString} in stack: \${stack}\`)`,
		tag: (strings: TemplateStringsArray, ...values: string[]) => {
			const finalString = String.raw({ raw: strings }, ...values);
			const lineNumber = finalString.split('\n').findIndex(line => line.includes('SOURCEMAP_LINE')) + 1;
			return finalString.replaceAll('SOURCEMAP_LINE', lineNumber.toString());
		}
	};

	return {
		// Test multi-byte character handling
		multiByteTest: sourcemap.tag`// UTF-8: café naïve résumé
// Emoji: 🚀 ⭐ 💾 
// Chinese: 你好世界
// Japanese: こんにちは
// Arabic: مرحبا
import ('node:fs');
const { stack } = new Error(); const searchString = 'index.utf8:SOURCEMAP_LINE'; assert(stack.includes(searchString), \`Expected \${searchString} in stack: \${stack}\`)`,

		// Test deeply nested structures
		nestedTest: sourcemap.tag`const deeply = {
	nested: {
		object: {
			with: {
				many: {
					levels: () => {
						import ('node:fs');
						const { stack } = new Error(); const searchString = 'index.nested:SOURCEMAP_LINE'; assert(stack.includes(searchString), \`Expected \${searchString} in stack: \${stack}\`)
					}
				}
			}
		}
	}
};`,

		// Test template literals and complex expressions
		complexExprTest: sourcemap.tag`const template = \`
	This is a template literal
	with multiple lines
	and \${expressions}
\`;

const arrow = (param: string) => {
	// Complex expression
	const result = param.split('\\n').map((line, idx) => {
		import ('node:fs');
		const { stack } = new Error(); const searchString = 'index.complex:SOURCEMAP_LINE'; assert(stack.includes(searchString), \`Expected \${searchString} in stack: \${stack}\`)
		return \`\${idx}: \${line}\`;
	});
	return result;
};`,

		// Test with TypeScript-specific syntax
		typescriptTest: sourcemap.tag`interface User {
	id: number;
	name: string;
	email?: string;
}

class UserService<T extends User> {
	private users: T[] = [];
	
	addUser(user: T): void {
		import ('node:fs');
		const { stack } = new Error(); const searchString = 'index.ts:SOURCEMAP_LINE'; assert(stack.includes(searchString), \`Expected \${searchString} in stack: \${stack}\`)
		this.users.push(user);
	}
}`,

		// Test with JSX elements
		jsxComplexTest: sourcemap.tag`import React from 'react';

interface Props {
	title: string;
	children?: React.ReactNode;
}

const Component: React.FC<Props> = ({ title, children }) => {
	const handleClick = () => {
		import ('node:fs');
		const { stack } = new Error(); const searchString = 'index.jsx:SOURCEMAP_LINE'; assert(stack.includes(searchString), \`Expected \${searchString} in stack: \${stack}\`)
	};
	
	return (
		<div onClick={handleClick}>
			<h1>{title}</h1>
			{children}
		</div>
	);
};`,

		// Test edge case: empty lines and whitespace-only lines
		whitespaceTest: sourcemap.tag`// Line 1

		// Line 3 with leading whitespace

// Line 5
import ('node:fs');
const { stack } = new Error(); const searchString = 'index.whitespace:SOURCEMAP_LINE'; assert(stack.includes(searchString), \`Expected \${searchString} in stack: \${stack}\`)

		// Line 9 with trailing whitespace   	
`,

		// Verify the sourcemap utility works correctly
		testLineNumberCalculation: (content: string): number => {
			return content.split('\n').findIndex(line => line.includes('SOURCEMAP_LINE')) + 1;
		},

		// Validate that all SOURCEMAP_LINE placeholders are replaced
		validateNoPlaceholders: (content: string): boolean => {
			return !content.includes('SOURCEMAP_LINE');
		}
	};
};