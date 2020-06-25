const meetings = require('express').Router();
const MeetingModel = require('../models/meeting-model');
const TopicModel = require('../models/topic-model');
const paginatedResults = require('../middleware/paginate');
const {handleMeeting} = require('../middleware/validation');
const logger = require('../logger');

meetings.post('/meetings', async (req, res) => {
  logger.debug('New meeting request', {
    body: req.body,
  });

  const {error} = handleMeeting(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const {date, topic, leader, duration, meetingHref, resourcesURL, description, tags, usefulLinks} = req.body || {};
  try {
    const topicExistsInDatabase = await TopicModel.findOne({topic: topic}).exec();

    let tagsUnion;
    if (!topicExistsInDatabase) {
      tagsUnion = tags;
      const newTopic = new TopicModel({
        topic,
        tags,
      });
      logger.debug('Saving new topic', {newTopic});
      await newTopic.save();
    } else {
      tagsUnion = [...topicExistsInDatabase.tags, ...tags];
    }

    const newMeeting = new MeetingModel({
      date,
      topic,
      leader,
      duration,
      meetingHref,
      resourcesURL,
      description,
      tags: tagsUnion,
      usefulLinks,
    });

    logger.debug('Saving new meeting', {newMeeting});

    const savedMeeting = await newMeeting.save();
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

    if (meeting) {
      const topicExistsInDatabase = await TopicModel.findOne({topic: meeting.topic});

      if (!topicExistsInDatabase) {
        const newTopic = new TopicModel({
          topic: meeting.topic,
        });
        const savedTopic = await newTopic.save();
      } else {
      }
    }
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

// get meetings schedule with incoming meetings and from last week
meetings.get('/meetings/schedule', paginatedResults(MeetingModel), async (req, res) => {
  try {
    if (req.query.limit && parseInt(req.query.limit) > 0) {
      const limit = parseInt(req.query.limit);
      const result = await MeetingModel.find({
        date: {$gte: new Date().getTime() - 1000 * 24 * 60 * 60 * limit},
      });
      res.send(result);
    } else {
      const result = await MeetingModel.find({
        date: {$gte: new Date().getTime() - 1000 * 24 * 60 * 60 * 7},
      });
      res.send(result);
    }
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
      .limit(1)
      .exec();
    res.json(result);
  } catch (err) {
    res.status(500).send(err);
  }
});
// get last X meetings
meetings.get('/meetings/last', async (req, res) => {
  // /meetings/last?amount=5 to get last 5 meetings
  try {
    const amount = parseInt(req.query.amount) || 3;
    const result = await MeetingModel.find({
      date: {$lte: new Date().getTime()},
    })
      .sort({date: -1})
      .limit(amount)
      .exec();
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
