const config = require('./config');

const Cryptr = require('cryptr');
const cryptr = new Cryptr(config.get('config_secret'));

const decryptedValue = cryptr.decrypt(process.argv[2]);
console.log(decryptedValue);