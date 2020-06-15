require('dotenv').config();
const config = require('config');

const Cryptr = require('cryptr');
const cryptr = new Cryptr(config.get('config_secret'));

function getConfigByKey(configKey, defaultValue) {
  try {
    const value = config.get(configKey);
    return value;
  } catch (error) {
    if (defaultValue) {
      return defaultValue;
    } else {
      throw error;
    }
  }
}

module.exports = {
  get: (configKey, defaultValue) => {
    const value = getConfigByKey(configKey, defaultValue);
    if (typeof value === 'string' && value.startsWith('!secret|')) {
      const encryptedValue = value.replace('!secret|', '');
      return cryptr.decrypt(encryptedValue);
    } else if (typeof value === 'object') {
      const string = JSON.stringify(value);
      const result = string.replace(/("(!secret\|.*?)")/g, (a) => {
        const encryptedValue = a.replace('"', '').replace('!secret|', '');
        const decryptedValue = cryptr.decrypt(encryptedValue);
        return `"${decryptedValue}"`;
      });
      return JSON.parse(result);
    } else {
      return value;
    }
  },
};
