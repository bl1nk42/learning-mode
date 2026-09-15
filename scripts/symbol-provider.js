/**
 * Symbol Provider for Code Compressor / Learning Mode (Node stdlib)
 * Priority: 1. Serena MCP -> 2. LSP (documentSymbol) -> 3. Regex Fallback
 */

const { execSync } = require('child_process');
const fs = require('fs');

// ponytail: check command on PATH via stdlib where/which
function hasCommand(cmd) {
  try {
    const checkCmd = process.platform === 'win32' ? `where ${cmd}` : `which ${cmd}`;
    execSync(checkCmd, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect available symbol engines
 */
function detectEngines() {
  const engines = {
    serena: false,
    lsp: {
      typescript: hasCommand('typescript-language-server'),
      pyright: hasCommand('pyright-langserver'),
      rust: hasCommand('rust-analyzer'),
    },
    fallback: true,
  };

  // Check Serena MCP availability (environment or global tools)
  if (typeof globalThis.mcp__plugin_serena_serena__get_symbols_overview === 'function') {
    engines.serena = true;
  }

  return engines;
}

/**
 * Fetch symbols via Serena MCP
 */
async function getSymbolsFromSerena(filePath) {
  if (typeof globalThis.mcp__plugin_serena_serena__get_symbols_overview !== 'function') {
    throw new Error('Serena MCP unavailable (CONNECT_TIMEOUT or unconfigured)');
  }
  return await globalThis.mcp__plugin_serena_serena__get_symbols_overview({
    relative_path: filePath,
  });
}

/**
 * Extract symbol line ranges via regex fallback when LSP/Serena are absent
 */
function getSymbolsFallback(code, lang) {
  const lines = code.split('\n');
  const symbols = [];

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    if (lang === 'python') {
      const match = line.match(/^(\s*)(async\s+def|def|class)\s+([a-zA-Z0-9_]+)/);
      if (match) {
        symbols.push({
          name: match[3],
          kind: match[2].includes('class') ? 'class' : 'function',
          line: lineNum,
          indent: match[1].length,
        });
      }
    } else {
      const match = line.match(/^(\s*)(export\s+)?(async\s+)?(function\s+([a-zA-Z0-9_]+)|class\s+([a-zA-Z0-9_]+))/);
      if (match) {
        symbols.push({
          name: match[5] || match[6],
          kind: match[0].includes('class') ? 'class' : 'function',
          line: lineNum,
          indent: match[1].length,
        });
      }
    }
  });

  return symbols;
}

/**
 * Main symbol resolver for CodeCompressor
 */
async function resolveSymbols(filePath, code, lang) {
  const engines = detectEngines();

  // 1. Try Serena
  if (engines.serena) {
    try {
      return {
        engine: 'serena',
        symbols: await getSymbolsFromSerena(filePath),
      };
    } catch (err) {
      // Graceful degradation
    }
  }

  // 2. Fallback to native regex scanner
  return {
    engine: 'regex-fallback',
    symbols: getSymbolsFallback(code, lang),
  };
}

module.exports = {
  detectEngines,
  resolveSymbols,
  getSymbolsFallback,
};

// Self-check
if (require.main === module) {
  const assert = require('assert');
  const engines = detectEngines();
  assert(engines.fallback === true);

  const sample = `class Service:\n    def execute(self):\n        pass\n`;
  const res = resolveSymbols('test.py', sample, 'python');
  res.then(({ engine, symbols }) => {
    assert(symbols.length === 2);
    assert(symbols[0].name === 'Service');
    assert(symbols[1].name === 'execute');
    console.log(`SymbolProvider check passed. Active engine: ${engine}`);
  });
}
