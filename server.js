const express = require('express');
const mongoOptions = {useNewUrlParser: true, useUnifiedTopology: true};
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const configuration = require('./config/configuration');
const passport = require('passport');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

//routes
const authRoutes = require('./routes/auth-routes');
const apiRoutes = require('./routes/api-routes');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(
  cookieSession({
    maxAge: 24 * 60 * 60 * 1000,
    keys: [configuration.session.cookieKey],
  })
);

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

// connect to mongodb
mongoose
  .connect(configuration.mongodb.dbURI, mongoOptions)
  .then(() => console.log('Connected to mongodb'))
  .catch(err => console.log('Could not connect to mongodb', err.message));

// set up routes
app.use('/auth', authRoutes);
app.use(apiRoutes);
