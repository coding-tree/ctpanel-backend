const router = require('express').Router();
// API

const MeetingModel = require('../models/meeting-model');
const TopicModel = require('../models/topic-model');
// #region meetings

router.get('/', (req, res) => {
    res.render('home', { user: req.user });
});

// post new meeting
router.post('/meetings', async (req, res) => {
    try {
        const meeting = new MeetingModel(req.body);
        const result = await meeting.save();
        res.send(result);
    } catch (err) {
        res.status(500).send(err);
    }
});

// get paginated meetings
router.get('/meetings', async (req, res) => {
    try {
        const page = req.query.page;
        const limit = req.query.limit;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const result = await MeetingModel.find().exec();
        const resultPaginated = result.slice(startIndex, endIndex)
        res.send(resultPaginated);
    } catch (err) {
        res.status(500).send(err);
    }
});
// get all meetings
router.get('/meetings/all', async (req, res) => {
    try {
        const result = await MeetingModel.find().exec();
        res.send(result);
    } catch (err) {
        res.status(500).send(err);
    }
});

// get all meetings sorted by date
router.get('/meetings/sorted', async (req, res) => {
    try {
        const result = await MeetingModel.find()
            .sort({ date: 1 })
            .exec();
        res.send(result);
    } catch (err) {
        res.status(500).send(err);
    }
});

// get closest incoming meeting
router.get('/meetings/incoming', async (req, res) => {
    try {
        const result = await MeetingModel.findOne({
            date: { $gte: new Date().getTime() },
        })
            .sort({ date: 1 })
            .limit(1)
            .exec();
        res.send(result);
    } catch (err) {
        res.status(500).send(err);
    }
});

// get last meeting
router.get('/meetings/last-one', async (req, res) => {
    try {
        const result = await MeetingModel.findOne({
            date: { $lte: new Date().getTime() },
        })
            .sort({ date: -1 })
            .limit(1);
        res.send(result);
    } catch (err) {
        res.status(500).send(err);
    }
});

// get meetings archive
router.get('/meetings/archive', async (req, res) => {
    try {
        const result = await MeetingModel.find({
            date: { $lte: new Date().getTime() },
        });
        res.send(result);
    } catch (err) {
        res.status(500).send(err);
    }
});

// get specific meeting by id
router.get('/meetings/:id', async (req, res) => {
    try {
        const meeting = await MeetingModel.findById(req.params.id).exec();
        res.send(meeting);
    } catch (err) {
        res.status(500).send(err);
    }
});

// update specific meeting
router.put('/meetings/:id', async (req, res) => {
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
router.delete('/meetings/:id', async (req, res) => {
    try {
        const result = await MeetingModel.deleteOne({ _id: req.params.id }).exec();
        res.send(result);
    } catch (err) {
        res.status(500).send(err);
    }
});
// #endregion

// #region topics

// get all topics
router.post('/topics', async (req, res) => {
    try {
        const topic = new TopicModel(req.body);
        const result = await topic.save();
        res.send(result);
    } catch (err) {
        res.status(500).send(err);
    }
});

// get paginated topics
router.get('/topics', async (req, res) => {
    try {
        const page = req.query.page;
        const limit = req.query.limit;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const result = await TopicModel.find().exec();
        const resultPaginated = result.slice(startIndex, endIndex)
        res.send(resultPaginated);
    } catch (err) {
        res.status(500).send(err);
    }
});

router.get('/topics/all', async (req, res) => {
    try {
        const result = await TopicModel.find().exec();
        res.send(result);
    } catch (err) {
        res.status(500).send(err)
    }
})

// update specific meeting
router.put('/topics/:id', async (req, res) => {
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
router.delete('/topics/:id', async (req, res) => {
    try {
        const result = await TopicModel.deleteOne({ _id: req.params.id }).exec();
        res.send(result);
    } catch (err) {
        res.status(500).send(err);
    }
});

// get top rated topic
router.get('/topics/top-rated', async (req, res) => {
    try {
        const result = await TopicModel.findOne();
        res.send(result);
    } catch (err) {
        res.status(500).send(err);
    }
});

// get specific topic by id
router.get('/topics/:id', async (req, res) => {
    try {
        const topic = await TopicModel.findById(req.params.id).exec();
        res.send(topic);
    } catch (err) {
        res.status(500).send(err);
    }
});

// vote for topic, validation is not working probably
router.put('/topics/vote/:id', async (req, res) => {
    try {
        const topicID = req.params.id;
        const isVoted = Object.values(req.cookies).indexOf(topicID.toString()) > -1;
        if (!isVoted) {
            const result = await TopicModel.findOneAndUpdate({ _id: topicID }, { $inc: { votes: 1 } }).exec();
            res.send(result);
        } else {
            res.cookie(topicID, topicID, { maxAge: 24 * 60 * 60 * 1000 });
            res.send(result);
        }
    } catch (err) {
        res.status(500).send(err);
    }
});
// #endregion

module.exports = router;