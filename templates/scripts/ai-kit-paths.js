const path = require('path');
const fs = require('fs');

const DEFAULT_CURSOR_DIR = '.cursor';
const FALLBACK_CURSOR_DIR = 'cursor-copy';

function normalizeCursorDir(value) {
  const trimmed = value.trim().replace(/\\/g, '/').replace(/\/+$/, '');
  return trimmed.length > 0 ? trimmed : DEFAULT_CURSOR_DIR;
}

function resolveCursorDir() {
  const envValue = process.env.AI_KIT_CURSOR_DIR;
  if (envValue && envValue.trim().length > 0) {
    return normalizeCursorDir(envValue);
  }
  const cursorConfig = path.join(process.cwd(), DEFAULT_CURSOR_DIR, 'ai-kit.config.json');
  if (fs.existsSync(cursorConfig)) {
    return DEFAULT_CURSOR_DIR;
  }
  const fallbackConfig = path.join(process.cwd(), FALLBACK_CURSOR_DIR, 'ai-kit.config.json');
  if (fs.existsSync(fallbackConfig)) {
    return FALLBACK_CURSOR_DIR;
  }
  return DEFAULT_CURSOR_DIR;
}

function cursorPath(...segments) {
  return path.join(process.cwd(), resolveCursorDir(), ...segments);
}

module.exports = {
  DEFAULT_CURSOR_DIR,
  FALLBACK_CURSOR_DIR,
  resolveCursorDir,
  cursorPath,
};
