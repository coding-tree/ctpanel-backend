// Load environment variables from .env
require('dotenv').config();

const express = require('express');
const mongoOptions = {useNewUrlParser: true, useUnifiedTopology: true};
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const configuration = require('./config/configuration');
const passport = require('passport');
const Auth0Strategy = require('passport-auth0');
const {requiresAuth} = require('express-openid-connect');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const util = require('util');
const url = require('url');
const querystring = require('querystring');
//routes
const authRoutes = require('./routes/auth-routes');
const apiRoutes = require('./routes/api-routes');
const topicsRoutes = require('./routes/topics-routes');
const meetingsRoutes = require('./routes/meetings-routes');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());

app.use(cookieParser());

app.use(
  cookieSession({
    maxAge: 24 * 60 * 60 * 1000,
    keys: [configuration.session.cookieKey],
  })
);

const auth0Config = {
  domain: process.env.AUTH0_DOMAIN,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  callbackURL: process.env.AUTH0_CALLBACK_URL || 'http://localhost:3001/callback',
};

console.log('Auth0 Configuration', auth0Config);

// Configure Passport to use Auth0
const strategy = new Auth0Strategy(auth0Config, function(accessToken, refreshToken, extraParams, profile, done) {
  return done(null, profile, extraParams.id_token);
});
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});
passport.use(strategy);

app.use(passport.initialize());
app.use(passport.session());

// app listen
app.listen(3001, () => {
  try {
    console.log('app now listening for requests on port 3001');
  } catch (err) {
    console.log(err);
  }
});

// connect to mongodb
mongoose
  .connect(configuration.mongodb.dbURI, mongoOptions)
  .then(() => console.log('Connected to mongodb'))
  .catch(err => console.log('Could not connect to mongodb', err.message));

// set up routes
app.use('/auth', authRoutes);
app.use(apiRoutes);
app.use(topicsRoutes);
app.use(meetingsRoutes);

// * SECURED MIDDLEWARE
function secured(req, res, next) {
  const token = req.cookies['auth0-token'];
  if (!token && !req.user) {
    res.status(401).send('Access Denied. No token provided');
  }
  next();
}

app.get('/check', secured, (req, res) => {
  console.log(req);
  if (req.user) {
    return res.send('ok');
  }
  return res.redirect('http://localhost:3001/login');
});

app.get('/user', secured, function(req, res) {
  if (req.user) {
    const {displayName, id, nickname, picture} = req.user;
    return res.json({displayName, id, nickname, picture, role: 'user'});
  }
  return res.redirect('http://localhost:3001/login');
});

// Perform the login, after login Auth0 will redirect to callback
app.get(
  '/login',
  passport.authenticate('auth0', {
    scope: 'openid email profile',
  }),
  function(req, res) {
    res.redirect('/');
  }
);

app.get('/callback', function(req, res, next) {
  passport.authenticate('auth0', function(err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect('/login');
    }

    req.logIn(user, function(err) {
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

// app.get('/', function (req, res, next) {
//   res.redirect('http://localhost:3000');
// });
// profile
app.get('/profile', requiresAuth(), (req, res) => {
  res.send(JSON.stringify(req.openid.user));
});
// * LOGOUT
app.get('/logout', (req, res) => {
  res.clearCookie('auth0-token', {path: '/'});
  res.clearCookie('auth0.is.authenticated', {path: '/'});
  req.logout();

  var returnTo = req.protocol + '://' + req.hostname;
  var port = req.connection.localPort;
  if (port !== undefined && port !== 80 && port !== 443) {
    returnTo += ':' + port;
  }
  var logoutURL = new url.URL(util.format('http://%s/v2/logout', process.env.AUTH0_DOMAIN));
  var searchString = querystring.stringify({
    client_id: process.env.AUTH0_CLIENT_ID,
    returnTo: returnTo,
  });
  logoutURL.search = searchString;

  res.redirect('http://localhost:3000/login');
});
