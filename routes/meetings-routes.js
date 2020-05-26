const meetings = require('express').Router();
const MeetingModel = require('../models/meeting-model');
const paginatedResults = require('../middleware/paginate');
const {handleMeeting} = require('../middleware/validation');

meetings.post('/meetings', async (req, res) => {
  const {error} = handleMeeting(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const {date, topic, leader, duration, meetingHref, resourcesURL, userfulLinks, description, tags} = req.body || {};
  const meeting = new MeetingModel({
    date,
    topic,
    leader,
    duration,
    meetingHref,
    resourcesURL,
    userfulLinks,
    description,
    tags,
  });
  try {
    const savedMeeting = await meeting.save();
    res.json(savedMeeting);
  } catch (err) {
    res.status(400).send(err);
  }
});

meetings.put('/meetings/:id', async (req, res) => {
  const {error} = handleMeeting(req.body);

  if (error) return res.status(400).send(error.details[0].message);
  try {
    const meeting = await MeetingModel.findById(req.params.id).exec();
    meeting.set(req.body);
    const result = await meeting.save();
    res.json(result);
  } catch (err) {
    res.status(400).send(err);
  }
});

// get paginated meetings
meetings.get('/meetings', paginatedResults(MeetingModel), async (req, res) => {
  try {
    res.json(res.paginatedResults);
  } catch (err) {
    res.status(500).send(err);
  }
});

// get meetings archive
meetings.get('/meetings/archive', paginatedResults(MeetingModel), async (req, res) => {
  try {
    const result = await MeetingModel.find({
      date: {$lte: new Date().getTime()},
    });
    res.send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

// get all meetings sorted by date
meetings.get('/meetings/sorted', async (req, res) => {
  try {
    const result = await MeetingModel.find().sort({date: 1}).exec();
    res.json(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

// get closest incoming meeting
meetings.get('/meetings/incoming', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit);
    const result = await MeetingModel.findOne({
      date: {$gte: new Date().getTime()},
    })
      .sort({date: 1})
      .limit(limit)
      .exec();
    res.json(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

// get last meeting
meetings.get('/meetings/last-one', async (req, res) => {
  try {
    const result = await MeetingModel.findOne({
      date: {$lte: new Date().getTime()},
    })
      .sort({date: -1})
      .limit(1);
    res.json(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

// get specific meeting by id
meetings.get('/meetings/:id', async (req, res) => {
  try {
    const meeting = await MeetingModel.findById(req.params.id).exec();
    res.json(meeting);
  } catch (err) {
    res.status(500).send(err);
  }
});

// delete specific meeting
meetings.delete('/meetings/:id', async (req, res) => {
  try {
    const result = await MeetingModel.deleteOne({_id: req.params.id}).exec();
    res.json(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = meetings;
