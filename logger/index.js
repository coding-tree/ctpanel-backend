const winston = require('winston');
const config = require('../config');
const logsPath = config.get('server.logsPath');

// Deploy on Heroku doesn't allow us to write files.
if (process.env.HEROKU) {
  let logger = winston.createLogger({
    level: 'info',
    transports: [
      new winston.transports.Console({
        level: 'debug',
        format: winston.format.simple(),
      }),
    ],
    exitOnError: false, // do not exit on handled exceptions
  });
  logger.stream = {
    write: function (message, encoding) {
      logger.info(message);
    },
  };
} else {
  let logger = winston.createLogger({
    level: 'info',
    transports: [
      new winston.transports.Console({
        level: 'debug',
        format: winston.format.simple(),
      }),
      new winston.transports.File({
        level: 'info',
        format: winston.format.json(),
        filename: `${logsPath}/app.log`,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false,
      }),
    ],
    exitOnError: false, // do not exit on handled exceptions
  });
  logger.stream = {
    write: function (message, encoding) {
      logger.info(message);
    },
  };
}

module.exports = logger;
