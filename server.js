const config = require('./config');

const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const logger = require('./logger');

const apiRoutes = require('./routes/api-routes');
const authRoutesProvider = require('./routes/auth');
const meetingsRoutes = require('./routes/meetings-routes');
const topicsRoutes = require('./routes/topics-routes');

const clientUrl = config.get('client.url');
const allowedHosts = config.get('client.allowedHosts', []);
const serverUrl = config.get('server.url');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var allowedOrigins = [clientUrl, serverUrl];

const isValidRefererOrClient = (origin) => {
  logger.debug(`Verifing client url: ${origin}, allowedHosts: ${allowedHosts}, allowedOrigins: ${allowedOrigins}`);
  const originUrl = new URL(origin);
  return allowedHosts.indexOf(originUrl.hostname) > -1 || allowedOrigins.indexOf(origin) > -1;
};

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (isValidRefererOrClient(origin)) {
        return callback(null, true);
      }
      logger.error(`CORS policy for ${origin} is not allowed`);
      var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    },
    credentials: true,
  })
);

const PORT = config.get('server.port');

async function connectDB() {
  const {host, resource, query, name} = config.get('mongo.uri');
  const dbCredentials = config.get('mongo.credentials');
  const settings = {
    ...dbCredentials,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  };
  const dbURI = `${name}://${host}/${resource}${query}`;
  logger.debug('Trying to connect to mongodb [URI] ', {dbURI});

  try {
    const connection = await mongoose.connect(dbURI, settings);
    logger.info('MoongoDB Connected');
    return connection;
  } catch (err) {
    logger.error('MoongoDB not connected', err);
  }
  return null;
}

app.use(authRoutesProvider.router());
app.use(apiRoutes);
app.use(topicsRoutes);
app.use(meetingsRoutes);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`app now listening for requests on port ${PORT}`);
  });
});
