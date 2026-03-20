const ora = require('ora');
const chalk = require('chalk');

/**
 * Creates a spinner with given text
 * @param {string} text - Text to display
 * @returns {object} - Spinner object with succeed(), fail(), text properties
 */
function spinner(text) {
  return ora(text);
}

/**
 * Color utilities
 */
const colors = {
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.blue,
  dim: chalk.dim,
  bold: chalk.bold,
  cyan: chalk.cyan,
  gray: chalk.gray
};

module.exports = {
  spinner,
  colors
};
