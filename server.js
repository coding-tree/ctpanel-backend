const express = require('express');
const mongoOptions = {useNewUrlParser: true, useUnifiedTopology: true};
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const configuration = require('./config/configuration');
const passport = require('passport');
const Auth0Strategy = require('passport-auth0');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const cors = require('cors');
const util = require('util');
const url = require('url');
const querystring = require('querystring');
const jwt = require('jsonwebtoken');

//routes
const authRoutes = require('./routes/auth-routes');
const apiRoutes = require('./routes/api-routes');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
// app.use(cors());

app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

// Load environment variables from .env

dotenv.config();

app.use(
  cookieSession({
    maxAge: 24 * 60 * 60 * 1000,
    keys: [configuration.session.cookieKey],
  })
);

// Configure Passport to use Auth0
const strategy = new Auth0Strategy(
  {
    domain: process.env.AUTH0_DOMAIN,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL: process.env.AUTH0_CALLBACK_URL || 'http://localhost:3001/callback',
  },
  function(accessToken, refreshToken, extraParams, profile, done) {
    return done(null, profile, extraParams.id_token);
  }
);

passport.use(strategy);

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

// * SECURED MIDDLEWARE
function secured(req, res, next) {
  const token = req.cookies['auth0-token'];
  if (!token) return res.status(401).send('Access Denied. No token provided');
  next();
  console.log(req.session.returnTo);
  req.session.returnTo = req.originalUrl;
}

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

      const returnTo = req.session.returnTo;
      delete req.session.returnTo;

      res.cookie('auth0-token', info, {httpOnly: true});
      res.redirect('/user');
    });
  })(req, res, next);
});

app.get('/', function(req, res, next) {
  console.log('siema');
  console.log(req.user);
  res.redirect('http://localhost:3000');
});

// * LOGOUT
app.get('/logout', (req, res) => {
  req.logout();
  res.clearCookie('auth0-token');

  var returnTo = req.protocol + '://' + req.hostname;
  var port = req.connection.localPort;
  if (port !== undefined && port !== 80 && port !== 443) {
    returnTo += ':' + port;
  }
  var logoutURL = new url.URL(util.format('https://%s/v2/logout', process.env.AUTH0_DOMAIN));
  var searchString = querystring.stringify({
    client_id: process.env.AUTH0_CLIENT_ID,
    returnTo: returnTo,
  });
  logoutURL.search = searchString;

  res.redirect(logoutURL);
});

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

app.get('/user', secured, function(req, res) {
  console.log(req.user);
  res.send({id: 1, name: 'Józef'});
  // res.redirect('http://localhost:3000/');
});
