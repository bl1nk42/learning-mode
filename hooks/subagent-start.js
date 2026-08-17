#!/usr/bin/env node
const { emit, readInput, readMode } = require('./runtime');
const { subagentInstructions } = require('./instructions');
const input = readInput();
emit('SubagentStart', readMode(input.cwd) === 'off' ? '' : subagentInstructions());
