const config = require('../config');

const Auth0Strategy = require('passport-auth0');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const express = require('express');
const logger = require('../logger');
const passport = require('passport');

const createRouting = () => {
  const router = express.Router();

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

  router.use(cookieParser());

  router.use(
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

  router.use(passport.initialize());
  router.use(passport.session());

  const secured = (req, res, next) => {
    if (!req.user) {
      res.status(401).send('Access Denied. No token provided');
    }
    next();
  };

  router.get('/check', secured, (req, res) => {
    if (req.user) {
      return res.send('ok');
    }
    return res.redirect(`${clientUrl}/login`);
  });

  router.get('/user', secured, (req, res) => {
    if (req.user) {
      req.app.set('user', req.user);
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

  router.get(
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

  router.get('/callback', (req, res, next) => {
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

  router.get('/logout', withReturnToUrl, (req, res) => {
    req.logout();
    const logoutURL = `https://${auth0Config.domain}/v2/logout?returnTo=${req.returnTo}/logout`;
    res.redirect(logoutURL);
  });

  return router;
};

module.exports = {
  createRouting
};
