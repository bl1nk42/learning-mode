#!/usr/bin/env node

const { emit, readInput, readMode, writeStatusFlag } = require('./runtime');
const { defaultInstructions } = require('./instructions');

const input = readInput();
const mode = readMode(input.cwd);
writeStatusFlag(input.cwd, mode);
emit('SessionStart', mode === 'off' ? '' : defaultInstructions());
