#!/usr/bin/env sh
flag="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/.learning-mode-active"
[ -f "$flag" ] || exit 0
mode=$(sed -n 's/.*"mode":"\([^"]*\)".*/\1/p' "$flag")
count=$(sed -n 's/.*"insights":\([0-9][0-9]*\).*/\1/p' "$flag")
[ "$mode" = "off" ] && printf '\033[38;5;244m[LEARN:OFF]\033[0m' && exit 0
printf '\033[38;5;75m[LEARN:%s]\033[0m' "${count:-0}"
