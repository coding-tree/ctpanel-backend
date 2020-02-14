// env
const MEETUP_SECRET = process.env.MEETUP_SECRET;
const defaultCfg = require('./defaultConfiguration');
const Cryptr = require('cryptr');
const fs = require('fs');

const saveDefaultConfiguration = () => {
    process.chdir('../config');
    process.cwd();
    fs.writeFile('./configuration.js', defaultCfg, 'utf8', err => {
        if (err) throw err;
        console.log('saved default configuration in file');
    })
}

if (MEETUP_SECRET !== undefined) {
    try {
        const cryptr = new Cryptr(MEETUP_SECRET);
        const decryptedString = cryptr.decrypt('1b5245609efb0b5e5f42c0dccf79a89712b13ba83ef17437b9c3b4376e1ddf3915e9439312850fa8516ce3a68382dea848f761fe1ef4decaf0b7ecd1980aa4a0d006e68fde1b88f292b3cbecb1c38f4358485d65bdd15ab8974b6128a6ed17d13bdf6b0fd3ede9185a7b2f17a3f77157beb349112ddaf8f1a8031539a1378bf0c855f6990b7aaa82f5e21d3e13f5dbc2c564524f38f9eb27efe89410657a07caa189da171ff9b0a4136e02a23a4265250683fd65d0f86121230cc198c9ce59c8d48806537a255b47eed723410ea50f4e524f1376142925b76b4fc69e61acb51fb3b1f490777ed05f459d15cd6c9747861469a014b40273f534cfb8b3d6bd1b67df44efb9ba7227c5a75b319ed9d33fa91368a0f227e748b4bfe2db46a122a8a76dbba60a6dfa55586d5609ae3667e49ebb4240b0317f7446f2dbe3beb2141a54d1d509215769de2a532ea2616a577c902870c428ee9a66cbe3f9869f2372e1c96b448e51de7bf8d9f8f93f1e1054ac7cb9b0c661601154e2857ad9e81a528d20b16dcdd232b40f85d56cbbe6050a20c35d8d95934afa6153593319d2e4a98e42168bed4e8bf31e0ccc9739e52f57213452e50dbc36b77b71089adead3cd72be89dd3878990039d4e970adb95ac05e2b2804c16c6ef73947db55802890ee635a6db0dd4b46a035ac4f1f65b62d717a66f15a56cc83f7c1328f66ade55716510');
        process.chdir('../config');
        process.cwd();
        fs.writeFile('./configuration.js', decryptedString, 'utf8', err => {
            if (err) throw err;
            console.log('saved decrypted string in file');
        })
    } catch (err) {
        saveDefaultConfiguration();
        console.log(err.message);
        console.log('you have passed wrong secret, saving default configuration');
    }
} else {
    try {
        saveDefaultConfiguration()
    } catch (err) {
        console.log(err.message);
    }
}
