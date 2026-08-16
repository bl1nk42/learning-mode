const fs = require('fs');
const path = require('path');

const contextPath = path.join(__dirname, 'learning-mode-context.txt');

try {
  const additionalContext = fs.readFileSync(contextPath, 'utf8');
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext },
  }));
} catch (error) {
  process.stderr.write(`Error: missing context file: ${contextPath}\n`);
  process.exitCode = 1;
}
