const fs = require('fs');
const path = require('path');
const os = require('os');

class ConfigManager {
  static CONFIG_DIR = path.join(os.homedir(), '.aiox');
  static CONFIG_FILE = path.join(ConfigManager.CONFIG_DIR, 'ollama-bridge.json');

  static DEFAULT_CONFIG = {
    ollama: { host: 'http://localhost:11434', model: 'llama3.2', complexityThreshold: 3 },
    routing: { forceOllama: false, forceClaude: false },
    chat: { maxHistory: 10, streaming: true },
  };

  static load() {
    try {
      if (fs.existsSync(ConfigManager.CONFIG_FILE)) {
        const data = fs.readFileSync(ConfigManager.CONFIG_FILE, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn(`Warning: Failed to load config: ${error.message}`);
    }
    return JSON.parse(JSON.stringify(ConfigManager.DEFAULT_CONFIG));
  }

  static save(config) {
    try {
      if (!fs.existsSync(ConfigManager.CONFIG_DIR)) {
        fs.mkdirSync(ConfigManager.CONFIG_DIR, { recursive: true });
      }
      fs.writeFileSync(ConfigManager.CONFIG_FILE, JSON.stringify(config, null, 2));
      return true;
    } catch (error) {
      console.error(`Failed to save config: ${error.message}`);
      return false;
    }
  }

  static reset() {
    return ConfigManager.save(JSON.parse(JSON.stringify(ConfigManager.DEFAULT_CONFIG)));
  }

  static get(path) {
    const config = ConfigManager.load();
    const keys = path.split('.');
    let value = config;
    for (const key of keys) {
      value = value?.[key];
    }
    return value;
  }

  static set(path, value) {
    const config = ConfigManager.load();
    const keys = path.split('.');
    let current = config;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) current[key] = {};
      current = current[key];
    }
    current[keys[keys.length - 1]] = value;
    return ConfigManager.save(config);
  }

  static display() {
    const config = ConfigManager.load();
    return JSON.stringify(config, null, 2);
  }

  static getPath() {
    return ConfigManager.CONFIG_FILE;
  }
}

module.exports = ConfigManager;
