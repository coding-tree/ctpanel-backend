// env
require('dotenv').config({path: '../.env'});
const { meetupSecret, encryptedKey } = require('./cryptoConfig');
const defaultCfg = require('./defaultConfiguration');
const Cryptr = require('cryptr');
const fs = require('fs');

const saveDefaultConfiguration = () => {
  process.chdir('../config');
  process.cwd();
  fs.writeFile('./configuration.js', defaultCfg, 'utf8', err => {
    if (err) throw err;
    console.log('saved default configuration in file');
  });
};

if (meetupSecret !== undefined) {
  try {
    const cryptr = new Cryptr(meetupSecret);
    const decryptedString = cryptr.decrypt(encryptedKey);
    process.chdir('../config');
    process.cwd();
    fs.writeFile('./configuration.js', decryptedString, 'utf8', err => {
      if (err) throw err;
      console.log('saved decrypted string in file');
    });
  } catch (err) {
    saveDefaultConfiguration();
    console.log(err.message);
    console.log('you have passed wrong secret, saving default configuration');
  }
} else {
  try {
    saveDefaultConfiguration();
  } catch (err) {
    console.log(err.message);
  }
}
