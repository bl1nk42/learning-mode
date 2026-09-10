#!/usr/bin/env node

/**
 * auto-collect-learning-map.js
 *
 * Hook that runs on Stop to collect insights and create learning map.
 * This is the auto-update hook for learning-map skill.
 *
 * Data flow:
 * 1. record-insights.js writes to ~/.learning-mode/insight-index.jsonl
 * 2. This hook reads from insight-index.jsonl
 * 3. Creates facets, beats, and map in ~/.learning-mode/projects/<id>/
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// --- Configuration ---
const LEARNING_MODE_HOME = process.env.LEARNING_MODE_HOME || path.join(os.homedir(), '.learning-mode');
const SCRIPT_DIR = path.join(__dirname, '..', 'scripts', 'learning-map');

// --- Helpers ---
function readInput() {
  try {
    return JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
  } catch {
    return {};
  }
}

function getProjectRoot() {
  // Try git root first, then current directory
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
  } catch {
    return process.cwd();
  }
}

// --- Main ---
function main() {
  const input = readInput();
  const projectRoot = getProjectRoot();

  // Check if learning mode is active
  const configPath = path.join(projectRoot, '.learning-mode', 'config.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.mode === 'off') {
        // Learning mode is off, don't collect
        return;
      }
    } catch {
      // Continue if config is invalid
    }
  }

  // Check if insight index exists
  const insightIndex = path.join(LEARNING_MODE_HOME, 'insight-index.jsonl');
  if (!fs.existsSync(insightIndex)) {
    // No insights yet, nothing to collect
    return;
  }

  // Run the collection script
  try {
    const scriptPath = path.join(SCRIPT_DIR, 'collect-facets.js');
    execSync(`node "${scriptPath}" "${projectRoot}"`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
  } catch (error) {
    // Don't fail the hook if collection fails
    console.error('Learning map collection failed:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
