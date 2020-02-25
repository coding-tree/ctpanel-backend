const topics = require('express').Router();
const TopicModel = require('../models/topic-model');
const paginatedResults = require('../middleware/paginate')

// #region topics

// get all topics
topics.post('/topics', async (req, res) => {
    try {
        const topic = new TopicModel(req.body);
        const result = await topic.save();
        res.json(result);
    } catch (err) {
        res.status(500).send(err);
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

// update specific meeting
topics.put('/topics/:id', async (req, res) => {
    try {
        const topic = await TopicModel.findById(req.params.id).exec();
        topic.set(req.body);
        const result = await topic.save();
        res.json(result);
    } catch {
        res.status(500).send(err);
    }
});

// delete specific meeting
topics.delete('/topics/:id', async (req, res) => {
    try {
        const result = await TopicModel.deleteOne({ _id: req.params.id }).exec();
        res.json(result);
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
            const result = await TopicModel.findOneAndUpdate({ _id: topicID }, { $inc: { votes: 1 } }).exec();
            res.json(result);
        } else {
            res.cookie(topicID, topicID, { maxAge: 24 * 60 * 60 * 1000 });
            res.json(result);
        }
    } catch (err) {
        res.status(500).send(err);
    }
});
module.exports = topics;