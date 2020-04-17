const config = require('./config');

const Cryptr = require('cryptr');
const cryptr = new Cryptr(config.get('config_secret'));

const encryptedValue = cryptr.encrypt(process.argv[2]);
console.log(encryptedValue);

const value = cryptr.decrypt(encryptedValue);
console.log(value);