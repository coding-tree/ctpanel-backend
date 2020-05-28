const topics = require('express').Router();
const TopicModel = require('../models/topic-model');
const MeetingModel = require('../models/meeting-model');
const paginatedResults = require('../middleware/paginate');
const {handleTopic} = require('../middleware/validation');
// #region topics

topics.post('/topics', async (req, res) => {
  const {error} = handleTopic(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const topic = new TopicModel({
    topic: req.body.topic,
    votes: req.body.votes,
    addedDate: req.body.addedDate,
    userAdded: req.body.userAdded,
    tags: req.body.tags,
  });
  try {
    const savedTopic = await topic.save();
    res.json(savedTopic);
  } catch (err) {
    res.status(400).send(err);
  }
});

// get paginated topics
topics.get('/topics', paginatedResults(TopicModel), async (req, res) => {
  try {
    res.json(res.paginatedResults);
  } catch (err) {
    res.status(500).send(err);
  }
});

// update specific meeting, should be changed to patch
topics.put('/topics/:id', async (req, res) => {
  const {error} = handleTopic(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  try {
    const topic = await TopicModel.findById(req.params.id).exec();
    topic.set(req.body);
    const result = await topic.save();
    res.json(result);
  } catch (err) {
    res.status(400).send(err);
  }
});

// delete specific meeting
topics.delete('/topics/:id', async (req, res) => {
  try {
    const topic = await TopicModel.find({_id: req.params.id}).exec();
    const topicName = await topic[0].topic;
    const isTopicInAnyMeeting = await MeetingModel.findOne({topic: topicName});
    if (isTopicInAnyMeeting) {
      return res.status(500).send(`Cannot remove topic "${topicName}", due to the fact that it is related with at least one meeting.`);
    }
    const result = await TopicModel.deleteOne({_id: req.params.id}).exec();
    return res.json(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

// get top rated topic
topics.get('/topics/top-rated', async (req, res) => {
  try {
    const result = await TopicModel.findOne();
    res.json(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

// get specific topic by id
topics.get('/topics/:id', async (req, res) => {
  try {
    const topic = await TopicModel.findById(req.params.id).exec();
    res.json(topic);
  } catch (err) {
    res.status(500).send(err);
  }
});

// vote for topic, validation is not working probably
topics.put('/topics/vote/:id', async (req, res) => {
  try {
    const topicID = req.params.id;
    const isVoted = Object.values(req.cookies).indexOf(topicID.toString()) > -1;
    if (!isVoted) {
      const result = await TopicModel.findOneAndUpdate({_id: topicID}, {$inc: {votes: 1}}).exec();
      res.json(result);
    } else {
      res.cookie(topicID, topicID, {maxAge: 24 * 60 * 60 * 1000});
      res.json(result);
    }
  } catch (err) {
    res.status(500).send(err);
  }
});
module.exports = topics;
