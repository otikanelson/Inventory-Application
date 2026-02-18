/**
 * Utility functions for formatting terminal output with ANSI colors
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Foreground colors
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  
  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m'
};

function success(text) {
  return `${colors.green}✓${colors.reset} ${text}`;
}

function error(text) {
  return `${colors.red}✗${colors.reset} ${text}`;
}

function warning(text) {
  return `${colors.yellow}⚠${colors.reset} ${text}`;
}

function info(text) {
  return `${colors.blue}ℹ${colors.reset} ${text}`;
}

function header(text) {
  return `\n${colors.bright}${colors.cyan}${text}${colors.reset}\n${'='.repeat(text.length)}`;
}

function subheader(text) {
  return `\n${colors.bright}${text}${colors.reset}`;
}

function dim(text) {
  return `${colors.dim}${text}${colors.reset}`;
}

function bold(text) {
  return `${colors.bright}${text}${colors.reset}`;
}

function separator() {
  return `\n${colors.gray}${'─'.repeat(60)}${colors.reset}\n`;
}

module.exports = {
  colors,
  success,
  error,
  warning,
  info,
  header,
  subheader,
  dim,
  bold,
  separator
};
