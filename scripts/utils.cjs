const fs = require('fs');

/**
 * Helper function to parse simple .env files without dependencies
 * @param {string} filePath - Absolute path to the .env file
 * @returns {Record<string, string>} Object containing parsed env keys and values
 */
function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed.includes('=')) return;
    
    const firstEqIndex = trimmed.indexOf('=');
    const key = trimmed.substring(0, firstEqIndex).trim();
    let value = trimmed.substring(firstEqIndex + 1).trim();
    
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value;
  });
  return env;
}

module.exports = { parseEnvFile };
