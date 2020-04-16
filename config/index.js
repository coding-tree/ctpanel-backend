require('dotenv').config();
const config = require('config');

const Cryptr = require('cryptr');
const cryptr = new Cryptr(config.get('config_secret'));

module.exports = {
  get: (configKey) => {
    const value = config.get(configKey);
    if (typeof value === 'string' && value.startsWith('!secret|')) {
      const encryptedValue = value.replace('!secret|', '');
      console.log('TEST', encryptedValue);
      return cryptr.decrypt(encryptedValue);
    } else if (typeof value === 'object') {
      const string = JSON.stringify(value);
      const result = string.replace(/("(!secret\|.*?)")/g, (a) => {
        const encryptedValue = a.replace('"', '').replace('!secret|', '');
        console.log('TEST', encryptedValue);
        const decryptedValue = cryptr.decrypt(encryptedValue);
        return `"${decryptedValue}"`;
      });
      return JSON.parse(result);
    } else {
      return value;
    }
  },
};
