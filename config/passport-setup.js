const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const keys = require('./keys');
const User = require('../models/user-model');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id).then(user => {
    done(null, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: keys.google.clientID,
      clientSecret: keys.google.clientSecret,
      callbackURL: '/auth/google/redirect',
    },
    (accessToken, refreshToken, profile, done) => {
      //callback
      User.findOne({googleId: profile.id}).then(currentUser => {
        if (currentUser) {
          console.log(`użytkownik ${currentUser.username} już istnieje. Logowanie...`);
          done(null, currentUser);
        } else {
          new User({
            username: profile.displayName,
            googleId: profile.id,
            thumbnail: profile.photos[0].value,
          })
            .save()
            .then(newUser => {
              console.log('new user created ' + newUser);
              done(null, newUser);
            });
        }
      });
    }
  )
);
