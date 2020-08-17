const MeetingModel = require('../models/meeting-model');
const TopicModel = require('../models/topic-model');
const paginatedResults = require('../middleware/paginate');
const {handleMeeting} = require('../middleware/validation');
const logger = require('../logger');
const {asyncMiddleware} = require('../middleware');
const router = require('express').Router();

const createOrGetTopic = async (topic, tags, description, userName) => {
  try {
    const existingTopic = await TopicModel.findOne({topic: topic}).exec();
    if (!existingTopic) {
      const newTopic = new TopicModel({
        topic,
        tags,
        description,
        userAdded: userName,
      });

      logger.debug('Saving new topic', {newTopic});
      await newTopic.save();
      return [true, newTopic];
    } else {
      return [false, existingTopic];
    }
  } catch (e) {
    throw {message: 'Error while adding topic during meeting insert', status: 500, cause: e};
  }
};

router.post(
  '/meetings',
  asyncMiddleware(async (req, res) => {
    logger.debug('New meeting request', {
      body: req.body,
    });

    const {error} = handleMeeting(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const {date, topic, leader, duration, meetingHref, resourcesURL, description, tags, usefulLinks} = req.body || {};

    const [newTopicCreated, meetingTopic] = await createOrGetTopic(topic, tags, description, leader);

    let tagsUnion = tags;
    if (!newTopicCreated) {
      tagsUnion = [...tags, ...meetingTopic.tags];
    }

    try {
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
      throw {status: 500, message: 'Internal Server Error'};
    }
  })
);

router.put(
  '/meetings/:id',
  asyncMiddleware(async (req, res) => {
    const {error} = handleMeeting(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const {date, topic, leader, duration, meetingHref, resourcesURL, description, tags, usefulLinks} = req.body || {};

    try {
      const meeting = await MeetingModel.findById(req.params.id).exec();
      if (meeting) {
        const [newTopicCreated, meetingTopic] = await createOrGetTopic(topic, tags, description, leader);
        let tagsUnion = tags;
        if (!newTopicCreated) {
          tagsUnion = [...tags, ...meetingTopic.tags];
        }
        meeting.set({
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
        const result = await meeting.save();
        res.json(result);
      } else {
        throw {status: 404, message: 'Meeting does not exists'};
      }
    } catch (err) {
      console.log(err);
      throw {status: 500, message: 'Internal Server Error'};
    }
  })
);

// get paginated meetings
router.get(
  '/meetings',
  paginatedResults(MeetingModel),
  asyncMiddleware(async (req, res) => {
    try {
      res.json(res.paginatedResults);
    } catch (err) {
      throw {status: 500, message: 'Internal Server Error'};
    }
  })
);

// get meetings archive
router.get(
  '/meetings/archive',
  paginatedResults(MeetingModel),
  asyncMiddleware(async (req, res) => {
    try {
      const result = await MeetingModel.find({
        date: {$lte: new Date().getTime()},
      });
      res.send(result);
    } catch (err) {
      throw {status: 500, message: 'Internal Server Error'};
    }
  })
);

// get meetings schedule with incoming meetings and from last week
router.get(
  '/meetings/schedule',
  paginatedResults(MeetingModel),
  asyncMiddleware(async (req, res) => {
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
      throw {status: 500, message: 'Internal Server Error'};
    }
  })
);

// get all meetings sorted by date
router.get(
  '/meetings/sorted',
  asyncMiddleware(async (req, res) => {
    try {
      const result = await MeetingModel.find().sort({date: 1}).exec();
      res.json(result);
    } catch (err) {
      throw {status: 500, message: 'Internal Server Error'};
    }
  })
);

// get closest incoming meeting
router.get(
  '/meetings/incoming',
  asyncMiddleware(async (req, res) => {
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
      throw {status: 500, message: 'Internal Server Error'};
    }
  })
);

// get last meeting
router.get(
  '/meetings/last-one',
  asyncMiddleware(async (req, res) => {
    try {
      const result = await MeetingModel.findOne({
        date: {$lte: new Date().getTime()},
      })
        .sort({date: -1})
        .limit(1)
        .exec();
      res.json(result);
    } catch (err) {
      throw {status: 500, message: 'Internal Server Error'};
    }
  })
);

// get last X meetings
router.get(
  '/meetings/last',
  asyncMiddleware(async (req, res) => {
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
      throw {status: 500, message: 'Internal Server Error'};
    }
  })
);

// get specific meeting by id
router.get(
  '/meetings/:id',
  asyncMiddleware(async (req, res) => {
    try {
      const meeting = await MeetingModel.findById(req.params.id).exec();
      res.json(meeting);
    } catch (err) {
      throw {status: 500, message: 'Internal Server Error'};
    }
  })
);

// delete specific meeting
router.delete(
  '/meetings/:id',
  asyncMiddleware(async (req, res) => {
    try {
      const result = await MeetingModel.deleteOne({_id: req.params.id}).exec();
      res.json(result);
    } catch (err) {
      throw {status: 500, message: 'Internal Server Error'};
    }
  })
);

module.exports = router;
