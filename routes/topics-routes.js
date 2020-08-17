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
    addedDate: req.body.addedDate,
    userAdded: req.body.userAdded,
    tags: req.body.tags,
    description: req.body.description,
  });

  try {
    const savedTopic = await topic.save();
    res.json(savedTopic);
  } catch (err) {
    res.status(500).send(err);
  }
});

topics.put('/topics/vote/:id', async (req, res) => {
  const user = req.app.get('user');
  if (!user) return res.redirect('/login');

  const topic = await TopicModel.findById(req.params.id).exec();
  if (!topic) return res.status(404).send('Podany temat nie istnieje');

  const {id} = user;
  const {vote} = req.query;

  const hasUserVoted = topic.usersVote.find((el) => el.id === id);

  const calculateResult = () => {
    let voteResult = 0;
    topic.usersVote.map((el) => {
      el.vote === 'up' && voteResult++;
      el.vote === 'down' && voteResult--;
    });
    return voteResult;
  };

  if (!hasUserVoted) {
    if (vote === 'up') topic.usersVote.push({id, vote});
    else if (vote === 'down') topic.usersVote.push({id, vote});
    else res.status(400).send('Bad request');
    topic.votes = calculateResult();
    const result = await topic.save();
    return res.json(result);
  } else {
    if ((vote === 'up' && hasUserVoted.vote === 'up') || (vote === 'down' && hasUserVoted.vote === 'down')) {
      const currentVote = topic.usersVote.find((topic) => topic.id === user.id);
      const index = topic.usersVote.findIndex((user) => user.id === currentVote.id);
      topic.usersVote.splice(index, 1);
    } else if ((vote === 'up' && hasUserVoted.vote === 'down') || (vote === 'down' && hasUserVoted.vote === 'up')) {
      hasUserVoted.vote = vote;
      console.log('juzer juz glosowol 2');
    } else {
      res.status(400).send('Bad request');
    }

    topic.votes = calculateResult();
    const result = await topic.save();
    return res.json(result);
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
    res.status(500).send(err);
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
