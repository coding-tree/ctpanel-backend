const express = require('express');
const passwordSetup = require('./config/passport-setup');
const mongoOptions = {useNewUrlParser: true, useUnifiedTopology: true};
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const keys = require('./config/keys');
const passport = require('passport');
const BodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

//routes
const authRoutes = require('./routes/auth-routes');
const profileRoutes = require('./routes/profile-routes');
const scheduleRoutes = require('./routes/schedule-routes');
const topicDatabaseRoutes = require('./routes/topic-database-routes');
const meetingsArchiveRoutes = require('./routes/meetings-archive-routes');

const app = express();

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({extended: true}));

// set view engine
app.set('view engine', 'ejs');
app.use(
  cookieSession({
    maxAge: 24 * 60 * 60 * 1000,
    keys: [keys.session.cookieKey],
  })
);

app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

// app listen
app.listen(3001, () => {
  console.log('app now listening for requests on port 3001');
});

// connect to mongodb
mongoose.connect(keys.mongodb.dbURI, mongoOptions, () => {
  console.log('connected to mongodb');
});

// set up routes
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/schedule', scheduleRoutes);
app.use('/topic-database', topicDatabaseRoutes);
app.use('/meetings-archive', meetingsArchiveRoutes);

// create home route
app.get('/', (req, res) => {
  res.render('home', {user: req.user});
});

// API
const MeetingModel = require('./models/meeting-model');
const TopicModel = require('./models/topic-model');
// #region meetings

// post new meeting
app.post('/meetings', async (req, res) => {
  try {
    const meeting = new MeetingModel(req.body);
    const result = await meeting.save();
    res.send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

// get all meetings
app.get('/meetings', async (req, res) => {
  try {
    const result = await MeetingModel.find().exec();
    res.send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

// get all meetings sorted by date
app.get('/meetings/sorted', async (req, res) => {
  try {
    const result = await MeetingModel.find()
      .sort({date: 1})
      .exec();
    res.send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

// get closest incoming meeting
app.get('/meetings/incoming', async (req, res) => {
  try {
    const result = await MeetingModel.find({
      date: {$gte: new Date().getTime()},
    })
      .sort({date: 1})
      .limit(1)
      .exec();
    res.send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

// get last meeting
app.get('/meetings/last-one', async (req, res) => {
  try {
    const result = await MeetingModel.find({
      date: {$lte: new Date().getTime()},
    })
      .sort({date: -1})
      .limit(1);
    res.send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

// get meetings archive
app.get('/meetings/archive', async (req, res) => {
  try {
    const result = await MeetingModel.find({
      date: {$lte: new Date().getTime()},
    });
    res.send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

// get specific meeting by id
app.get('/meetings/:id', async (req, res) => {
  try {
    const meeting = await MeetingModel.findById(req.params.id).exec();
    res.send(meeting);
  } catch (err) {
    res.status(500).send(err);
  }
});

// update specific meeting
app.put('/meetings/:id', async (req, res) => {
  try {
    const meeting = await MeetingModel.findById(req.params.id).exec();
    meeting.set(req.body);
    const result = await meeting.save();
    res.send(result);
  } catch {
    res.status(500).send(err);
  }
});

// delete specific meeting
app.delete('/meetings/:id', async (req, res) => {
  try {
    const result = await MeetingModel.deleteOne({_id: req.params.id}).exec();
    res.send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});
// #endregion

// #region topics

// get all topics
app.post('/topics', async (req, res) => {
  try {
    const topic = new TopicModel(req.body);
    const result = await topic.save();
    res.send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

// get topics
app.get('/topics', async (req, res) => {
  try {
    const result = await TopicModel.find().exec();
    res.send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

// update specific meeting
app.put('/topics/:id', async (req, res) => {
  try {
    const topic = await TopicModel.findById(req.params.id).exec();
    topic.set(req.body);
    const result = await topic.save();
    res.send(result);
  } catch {
    res.status(500).send(err);
  }
});

// delete specific meeting
app.delete('/topics/:id', async (req, res) => {
  try {
    const result = await TopicModel.deleteOne({_id: req.params.id}).exec();
    res.send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

// get top rated topic
app.get('/topics/top-rated', async (req, res) => {
  try {
    const result = await TopicModel.findOne();
    res.send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

// get specific topic by id
app.get('/topics/:id', async (req, res) => {
  try {
    const topic = await TopicModel.findById(req.params.id).exec();
    res.send(topic);
  } catch (err) {
    res.status(500).send(err);
  }
});

// vote for topic, validation is not working probably
app.put('/topics/vote/:id', async (req, res) => {
  try {
    const topicID = req.params.id;
    const isVoted = Object.values(req.cookies).indexOf(topicID.toString()) > -1;
    if (!isVoted) {
      const result = await TopicModel.findOneAndUpdate({_id: topicID}, {$inc: {votes: 1}}).exec();
      res.send(result);
    } else {
      res.cookie(topicID, topicID, {maxAge: 24 * 60 * 60 * 1000});
      res.send(result);
    }
  } catch (err) {
    res.status(500).send(err);
  }
});
// #endregion
