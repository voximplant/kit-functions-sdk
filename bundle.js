var dts = require('dts-bundle');
const fs = require('fs');
const path = require('path');

// Generate the d.ts bundle
dts.bundle({
  out: '../voximplant-kit-sdk.d.ts',
  name: '@voximplant/kit-functions-sdk',
  main: 'dist/dts/index.d.ts'
});

// Path to the examples directory
const EXAMPLES_DIR = path.resolve(__dirname, 'doc/examples');
// Path to the generated d.ts file
const DTS_FILE_PATH = path.resolve(__dirname, 'dist/voximplant-kit-sdk.d.ts');

// Function to process the d.ts file and embed examples
function processExamples() {
  console.log('Processing examples in d.ts file...');

  // Read the generated d.ts file
  let dtsContent = fs.readFileSync(DTS_FILE_PATH, 'utf8');

  // Regular expression to find @exampleFile tags
  const exampleRegex = /@exampleFile\s+([a-zA-Z0-9_/.-]+)/g;

  // Find all matches
  let match;
  let replacements = [];

  while ((match = exampleRegex.exec(dtsContent)) !== null) {
    const exampleFilePath = match[1];
    const fullPath = path.join(EXAMPLES_DIR, exampleFilePath);

    try {
      // Check if the example file exists
      if (fs.existsSync(fullPath)) {
        // Read the example file content
        // Remove Markdown code block markers and extract the code
        let cleanedExample = fs.readFileSync(fullPath, 'utf8');

        // Remove the opening Markdown code block marker (```js or ```javascript)
        cleanedExample = cleanedExample.replace(/```(?:js|javascript)?/, '');

        // Remove the closing Markdown code block marker (```)
        cleanedExample = cleanedExample.replace(/```\s*$/, '');

        // Trim whitespace
        cleanedExample = cleanedExample.trim();

        // Prepare formatted example (with proper indentation for JSDoc)
        const formattedExample = `
                * \`\`\`javascript
                * ${cleanedExample.replace(/\n/g, '\n                * ')}
                * \`\`\``;

        // Add to replacements list
        replacements.push({
          tag: match[0],
          content: formattedExample
        });

        console.log(`Processed example: ${exampleFilePath}`);
      } else {
        console.warn(`Warning: Example file not found: ${fullPath}`);
      }
    } catch (error) {
      console.error(`Error processing example file ${fullPath}:`, error);
    }
  }

  // Apply all replacements
  replacements.forEach(({ tag, content }) => {
    dtsContent = dtsContent.replace(tag, content);
  });

  // Write the modified content back to the d.ts file
  fs.writeFileSync(DTS_FILE_PATH, dtsContent);

  console.log(`Processed ${replacements.length} example files in the d.ts file`);
}

// Process the generated d.ts file
processExamples();
