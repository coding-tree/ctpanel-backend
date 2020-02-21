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
const path = require('path');

//routes
const authRoutes = require('./routes/auth-routes');
const apiRoutes = require('./routes/api-routes');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());

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
    // accessToken is the token to call Auth0 API (not needed in the most cases)
    // extraParams.id_token has the JSON Web Token
    // profile has all the information from the user
    // console.log(profile);
    console.log(extraParams.id_token);
    return done(null, profile);
  }
);

passport.use(strategy);

app.use(cookieParser());
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

// app.use(express.static(__dirname + '/../client/public'));
// app
//   .get('*', (req, res) => res.sendFile(path.join(__dirname + '/../client/public/index.html')))
//   .listen(3001, () => console.log('Server on port 3000'));

// connect to mongodb
mongoose
  .connect(configuration.mongodb.dbURI, mongoOptions)
  .then(() => console.log('Connected to mongodb'))
  .catch(err => console.log('Could not connect to mongodb', err.message));

// set up routes
app.use('/auth', authRoutes);
app.use(apiRoutes);

// TEST

// Perform the login, after login Auth0 will redirect to callback
app.get(
  '/login2',
  passport.authenticate('auth0', {
    scope: 'openid email profile',
  }),
  function(req, res) {
    console.log('siema');
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
      res.redirect(returnTo || '/user');
    });
  })(req, res, next);
});

app.get('/', function(req, res, next) {
  res.render('index', {title: 'Auth0 Webapp sample Nodejs'});
});

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

app.get('/user', (req, res) => {
  res.redirect('http://localhost:3000/');
});
