// validation
const Joi = require("@hapi/joi");

// register validation
const handleMeeting = (data) => {
    const schema = Joi.object({
        date: Joi.date().timestamp().required(),
        topic: Joi.string().min(6).required(),
        leader: Joi.string().min(3).max(128).required(),
        duration: Joi.string().min(3).max(8),
        resourcesURL: Joi.link(),
        usefulLinks: Joi.array(),
        description: Joi.string().max(1024),
        tags: Joi.array().items(Joi.string()).required(),
    })
    return schema.validate(data)
}

const handleTopic = (data) => {
    const schema = Joi.object({
        topic: Joi.string().min(6).max(256).required(),
        votes: Joi.number(),
        addedDate: Joi.date().timestamp(),
        userAdded: Joi.string().min(6).max(40),
        tags: Joi.array().items(Joi.string()).required()
    })
    return schema.validate(data);
}

module.exports.handleMeeting = handleMeeting;
module.exports.handleTopic = handleTopic;