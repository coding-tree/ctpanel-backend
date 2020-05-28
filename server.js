const config = require('./config');

const {requiresAuth} = require('express-openid-connect');
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
const serverUrl = config.get('server.url');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var allowedOrigins = [clientUrl, serverUrl];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        var msg = 'The CORS policy for this site does not ' + 'allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
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

const strategy = new Auth0Strategy(auth0Config, (accessToken, refreshToken, extraParams, profile, done) => {
  return done(null, profile, extraParams.id_token);
});

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
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
  const token = req.cookies['auth0-token'];
  if (!token && !req.user) {
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
    const {displayName, id, nickname, picture} = req.user;
    res.json(req.user);
  }
});

app.get(
  '/login',
  passport.authenticate('auth0', {
    scope: 'openid email profile',
  }),
  (req, res) => {
    res.redirect('/');
  }
);

app.get('/callback', (req, res, next) => {
  try {
    passport.authenticate('auth0', (err, user, info) => {
      if (err) {
        logger.error('error while fetching callback', err);
        res.send({message: 'error while fetching callback', err});
        return err;
      }
      if (!user) {
        return res.redirect('/login');
      }

      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        res.cookie('auth0-token', info, {httpOnly: true});
        res.redirect(clientUrl);
      });
    })(req, res, next);
  } catch (err) {
    logger.error('error while fetching callback', err);
    res.send({message: 'error while fetching callback', err});
  }
});

app.get('/profile', requiresAuth(), (req, res) => {
  res.send(JSON.stringify(req.openid.user));
});

app.get('/logout', (req, res) => {
  req.logout();
  res.clearCookie('auth0-token', {path: '/'});
  res.clearCookie('auth0.is.authenticated', {path: '/'});
  const logoutURL = `https://${auth0Config.domain}/v2/logout?returnTo=${clientUrl}/logout`;
  res.redirect(logoutURL);
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`app now listening for requests on port ${PORT}`);
  });
});
