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
const querystring = require('querystring');
const url = require('url');
const util = require('util');

const apiRoutes = require('./routes/api-routes');
const meetingsRoutes = require('./routes/meetings-routes');
const topicsRoutes = require('./routes/topics-routes');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());

app.use(cookieParser());

app.use(
  cookieSession({
    maxAge: 24 * 60 * 60 * 1000,
    keys: [config.get('server.session.cookieKey')],
  })
);

const auth0Config = config.get('auth0');
console.log('Auth0 Configuration', auth0Config);

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
  console.log('Trying to connect to mongodb [URI] ', {dbURI});

  try {
    const connection = await mongoose.connect(dbURI, settings);
    console.log('MoongoDB Connected');
    return connection;
  } catch (err) {
    console.log('MoongoDB not connected', err);
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
  console.log(req);
  if (req.user) {
    return res.send('ok');
  }
  return res.redirect('http://localhost:3001/login');
});

app.get('/user', secured, (req, res) => {
  if (req.user) {
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
  passport.authenticate('auth0', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect('/login');
    }

    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      res.cookie('auth0-token', info, {httpOnly: true});
      const returnTo = req.session.returnTo;
      delete req.session.returnTo;

      res.redirect('http://localhost:3000');
    });
  })(req, res, next);
});

app.get('/profile', requiresAuth(), (req, res) => {
  res.send(JSON.stringify(req.openid.user));
});

app.get('/logout', (req, res) => {
  req.logout();
  res.clearCookie('auth0-token', {path: '/'});
  res.clearCookie('auth0.is.authenticated', {path: '/'});
  const logoutURL = `https://${process.env.AUTH0_DOMAIN}/v2/logout?returnTo=${process.env.AUTH0_LOGIN_URL}`;
  res.redirect(logoutURL);
});

connectDB().then(() => {
  app.listen(3001, () => {
    console.log('app now listening for requests on port 3001');
  });
});