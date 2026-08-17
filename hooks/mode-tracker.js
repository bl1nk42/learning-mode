#!/usr/bin/env node
const { emit, readInput, readMode, setMode, writeStatusFlag } = require('./runtime');
const input = readInput();
const prompt = String(input.prompt || input.user_prompt || input.message || '');
const match = prompt.match(/(?:\$|\/)learning-mode\s+(default|off)\b/i);
if (match) setMode(input.cwd, match[1].toLowerCase());
const mode = readMode(input.cwd);
writeStatusFlag(input.cwd, mode);
emit('UserPromptSubmit', match ? `Learning Mode is now ${mode}.` : '');
