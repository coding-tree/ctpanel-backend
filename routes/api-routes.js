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
router.get('/meetings', paginatedResults(MeetingModel), async (req, res) => {
    try {
        res.json(res.paginatedResults)
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
router.get('/topics', paginatedResults(TopicModel), async (req, res) => {
    try {
        res.json(res.paginatedResults);
    } catch (err) {
        res.status(500).send(err);
    }
});

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

// pagination
function paginatedResults(model) {
    return async (req, res, next) => {
        const page = parseInt(req.query.page)
        const limit = parseInt(req.query.limit)

        const startIndex = (page - 1) * limit
        const endIndex = page * limit

        const results = {}

        if (endIndex < await model.countDocuments().exec()) {
            results.next = {
                page: page + 1,
                limit: limit
            }
        }

        if (startIndex > 0) {
            results.previous = {
                page: page - 1,
                limit: limit
            }
        }
        try {
            results.results = await model.find().limit(limit).skip(startIndex).exec()
            res.paginatedResults = results
            next()
        } catch (e) {
            res.status(500).json({ message: e.message })
        }
    }
}

module.exports = router;