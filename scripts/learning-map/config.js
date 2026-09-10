#!/usr/bin/env node

/**
 * config.js
 *
 * Learning Mode configuration.
 * Vault path can be set via:
 * 1. Environment variable: LEARNING_MODE_VAULT
 * 2. Config file: ~/.learning-mode/config.json
 * 3. OS-level default: ~/LearningVault
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// --- Defaults ---
const DEFAULT_VAULT_NAME = '.learning-mode';
const CONFIG_DIR = path.join(os.homedir(), '.learning-mode');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// --- Get vault path ---
function getVaultPath() {
  // 1. Environment variable (highest priority)
  if (process.env.LEARNING_MODE_VAULT) {
    return process.env.LEARNING_MODE_VAULT;
  }

  // 2. Config file
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      if (config.vaultPath) {
        return config.vaultPath;
      }
    } catch {
      // Continue to default
    }
  }

  // 3. OS-level default
  return path.join(os.homedir(), DEFAULT_VAULT_NAME);
}

// --- Save vault path ---
function saveVaultPath(vaultPath) {
  // Ensure config directory exists
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  // Read existing config or create new
  let config = {};
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch {
      config = {};
    }
  }

  // Update vault path
  config.vaultPath = vaultPath;
  config.lastUpdated = new Date().toISOString();

  // Save
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// --- Get project directory ---
function getProjectDir(projectRoot) {
  const crypto = require('crypto');
  const projectId = crypto.createHash('md5').update(projectRoot).digest('hex').slice(0, 8);
  const vaultPath = getVaultPath();
  return path.join(vaultPath, 'projects', projectId);
}

// --- Get session map path ---
function getSessionMapPath(projectRoot) {
  const crypto = require('crypto');
  const projectId = crypto.createHash('md5').update(projectRoot).digest('hex').slice(0, 8);
  const today = new Date().toISOString().split('T')[0];
  const configDir = path.join(os.homedir(), '.learning-mode');
  return path.join(configDir, 'session-maps', `${projectId}-${today}.json`);
}

// --- Initialize vault ---
function initVault(vaultPath) {
  // Create directories
  const dirs = [
    vaultPath,
    path.join(vaultPath, 'projects'),
    path.join(vaultPath, 'insight-wikis'),
    path.join(vaultPath, 'teach'),
    path.join(vaultPath, 'teach', 'learning-records'),
    path.join(vaultPath, 'teach', 'exercises')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Create config
  saveVaultPath(vaultPath);

  return vaultPath;
}

// --- Export ---
module.exports = {
  getVaultPath,
  saveVaultPath,
  getProjectDir,
  getSessionMapPath,
  initVault,
  CONFIG_FILE,
  DEFAULT_VAULT_NAME
};

// --- CLI ---
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args[0] === 'get') {
    console.log(getVaultPath());
  } else if (args[0] === 'set' && args[1]) {
    saveVaultPath(args[1]);
    console.log(`Vault path set to: ${args[1]}`);
  } else if (args[0] === 'init' && args[1]) {
    initVault(args[1]);
    console.log(`Vault initialized at: ${args[1]}`);
  } else {
    console.log('Usage:');
    console.log('  node config.js get              Show current vault path');
    console.log('  node config.js set <path>       Set vault path');
    console.log('  node config.js init <path>      Initialize vault at path');
  }
}
