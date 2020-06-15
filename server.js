const config = require('./config');

const Auth0Strategy = require('passport-auth0');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const logger = require('./logger');

const apiRoutes = require('./routes/api-routes');
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

const withReturnToUrl = (req, res, next) => {
  const returnToParam = req.query.returnTo;
  const referer = req.get('referer');
  logger.debug('Login request', {
    referer,
    returnToParam,
  });
  const returnTo = returnToParam ? returnToParam : referer ? referer : clientUrl;
  const fiexedRedirectTo = returnTo.replace(/\/$/, '');
  req.returnTo = fiexedRedirectTo;
  next();
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

app.use(cookieParser());

app.use(
  cookieSession({
    maxAge: 24 * 60 * 60 * 1000,
    keys: [config.get('server.session.cookieKey')],
  })
);

const auth0Config = config.get('auth0');
logger.info('Auth0 Configuration', auth0Config);

const strategy = new Auth0Strategy({...auth0Config, state: false}, (accessToken, refreshToken, extraParams, profile, done) => {
  logger.debug('Received tokens', {
    accessToken,
    refreshToken,
    extraParams,
    profile,
  });

  return done(null, profile, extraParams.id_token);
});

passport.serializeUser((user, done) => {
  logger.debug('Serialize user', {
    user,
  });

  done(null, user);
});

passport.deserializeUser((user, done) => {
  logger.debug('Deserialize user', {
    user,
  });
  done(null, user);
});

passport.use(strategy);

app.use(passport.initialize());
app.use(passport.session());

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

app.use(apiRoutes);
app.use(topicsRoutes);
app.use(meetingsRoutes);

const secured = (req, res, next) => {
  if (!req.user) {
    res.status(401).send('Access Denied. No token provided');
  }
  next();
};

app.get('/check', secured, (req, res) => {
  if (req.user) {
    return res.send('ok');
  }
  return res.redirect(`${clientUrl}/login`);
});

app.get('/user', secured, (req, res) => {
  if (req.user) {
    app.set('user', req.user);
    res.json(req.user);
  }
});

const encodeState = (data) => {
  let buff = new Buffer(JSON.stringify(data));
  return buff.toString('base64');
};

const decodeState = (data) => {
  let buff = new Buffer(data, 'base64');
  return JSON.parse(buff.toString('ascii'));
};

app.get(
  '/login',
  withReturnToUrl,
  (req, res, next) => {
    const state = encodeState({returnTo: req.returnTo});
    const authParams = {
      connection: 'Discord',
      scope: 'openid email profile',
      state,
    };

    logger.debug('Auth redirection parameters', authParams);

    passport.authenticate('auth0', authParams)(req, res, next);
  },
  (req, res) => {
    res.redirect('/');
  }
);

app.get('/callback', (req, res, next) => {
  const authParams = req.query;
  logger.debug('Callback request params', {
    ...authParams,
  });
  const state = decodeState(authParams.state);

  try {
    passport.authenticate('auth0', (err, user, info) => {
      logger.debug('Auth callback', {
        err,
        user,
        info,
      });
      if (err) {
        logger.error('error while fetching callback', err);
        res.send({message: 'error while fetching callback', err});
        return err;
      }

      if (!user) {
        logger.error('No user fetched after callback', {user});
        return res.redirect(clientUrl);
      }

      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        logger.debug('Successful user login', {
          user,
          state,
        });
        res.redirect(state.returnTo);
      });
    })(req, res, next);
  } catch (err) {
    logger.error('error while fetching callback', err);
    res.send({message: 'error while fetching callback', err});
  }
});

app.get('/logout', withReturnToUrl, (req, res) => {
  req.logout();
  const logoutURL = `https://${auth0Config.domain}/v2/logout?returnTo=${req.returnTo}/logout`;
  res.redirect(logoutURL);
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`app now listening for requests on port ${PORT}`);
  });
});
