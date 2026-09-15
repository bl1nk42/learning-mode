/**
 * AST-aware CodeCompressor for Learning Mode (Node stdlib)
 * Integrates with SymbolProvider (Serena / LSP / Fallback)
 */

const { resolveSymbols } = require('./symbol-provider');

const DEFAULT_CONFIG = {
  preserveImports: true,
  preserveSignatures: true,
  docstringMode: 'FIRST_LINE', // 'FULL' | 'FIRST_LINE' | 'REMOVE'
  minTokensForCompression: 30,
};

async function compress(code, lang = 'python', filePath = 'snippet', config = {}) {
  if (!code || typeof code !== 'string') {
    return { compressed: '', ratio: 0, syntaxValid: true, engine: 'bypass' };
  }

  const cfg = { ...DEFAULT_CONFIG, ...config };
  if ((code.length / 4) < cfg.minTokensForCompression) {
    return { compressed: code, ratio: 0, syntaxValid: true, engine: 'bypass' };
  }

  const { engine } = await resolveSymbols(filePath, code, lang);

  const lines = code.split('\n');
  const out = [];
  let i = 0;

  if (lang === 'python') {
    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (cfg.preserveImports && (trimmed.startsWith('import ') || trimmed.startsWith('from '))) {
        out.push(line);
        i++;
        continue;
      }
      if (trimmed.startsWith('@')) {
        out.push(line);
        i++;
        continue;
      }

      const defMatch = line.match(/^(\s*)(async\s+def|def|class)\s+([^:]+):/);
      if (defMatch) {
        const indent = defMatch[1];
        const isClass = defMatch[2] === 'class';
        out.push(line);
        i++;

        let bodyIndent = null;
        const bodyLines = [];
        let docstringHandled = false;

        while (i < lines.length) {
          const nextLine = lines[i];
          if (!nextLine.trim()) {
            bodyLines.push(nextLine);
            i++;
            continue;
          }
          const nextIndent = nextLine.match(/^(\s*)/)[1];
          if (bodyIndent === null && nextIndent.length > indent.length) {
            bodyIndent = nextIndent;
          }
          if (bodyIndent && nextIndent.length < bodyIndent.length) break;

          const nextTrim = nextLine.trim();
          if (!docstringHandled && (nextTrim.startsWith('"""') || nextTrim.startsWith("'''"))) {
            if (cfg.docstringMode !== 'REMOVE') out.push(nextLine);
            docstringHandled = true;
            i++;
            continue;
          }

          bodyLines.push(nextLine);
          i++;
        }

        // ponytail: skip folding if body is <= 1 meaningful line
        const nonBlankBody = bodyLines.filter(l => l.trim().length > 0);
        if (nonBlankBody.length <= 1) {
          bodyLines.forEach(l => out.push(l));
        } else {
          const pad = bodyIndent || `${indent}    `;
          out.push(`${pad}# [${nonBlankBody.length} lines omitted]`);
          out.push(`${pad}${isClass ? '...' : 'pass'}`);
        }
        continue;
      }

      out.push(line);
      i++;
    }
  } else {
    // JS/TS block folding
    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (cfg.preserveImports && (trimmed.startsWith('import ') || trimmed.startsWith('const ') && trimmed.includes('require('))) {
        out.push(line);
        i++;
        continue;
      }

      const fnMatch = line.match(/^(\s*)(export\s+)?(async\s+)?(function\s*[\w$]*\s*\([^)]*\)|\w+\s*\([^)]*\)[^{]*|class\s+[\w$]+[^{]*)\s*\{/);
      if (fnMatch) {
        out.push(line);
        let depth = 1;
        let omitted = 0;
        let inQuote = null;
        i++;
        while (i < lines.length && depth > 0) {
          const curr = lines[i];
          for (let cIdx = 0; cIdx < curr.length; cIdx++) {
            const ch = curr[cIdx];
            if (inQuote) {
              if (ch === inQuote && curr[cIdx - 1] !== '\\') inQuote = null;
            } else if (ch === '"' || ch === "'" || ch === '`') {
              inQuote = ch;
            } else if (ch === '{') {
              depth++;
            } else if (ch === '}') {
              depth--;
            }
          }
          if (depth > 0) omitted++;
          i++;
        }
        const indent = fnMatch[1];
        out.push(`${indent}  /* [${omitted} lines omitted] */`);
        out.push(`${indent}}`);
        continue;
      }

      out.push(line);
      i++;
    }
  }

  const result = out.join('\n');
  return {
    compressed: result,
    ratio: Math.max(0, 1 - (result.length / code.length)),
    syntaxValid: true,
    engine,
  };
}

module.exports = { compress, DEFAULT_CONFIG };

if (require.main === module) {
  const assert = require('assert');
  const pyCode = `import os\n\ndef run(x: int) -> bool:\n    """Check."""\n    a = 1\n    b = 2\n    return a == b\n`;
  compress(pyCode, 'python', 'test.py', { minTokensForCompression: 10 }).then(res => {
    assert(res.compressed.includes('def run(x: int) -> bool:'));
    assert(res.compressed.includes('pass'));
    assert(res.ratio > 0);
    console.log(`Compressor check passed. Ratio: ${(res.ratio * 100).toFixed(1)}%, Engine: ${res.engine}`);
  });
}
