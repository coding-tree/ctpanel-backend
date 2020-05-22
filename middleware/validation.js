// validation
const Joi = require('@hapi/joi');

// register validation
const handleMeeting = (data) => {
  const schema = Joi.object({
    date: Joi.date().timestamp().required(),
    topic: Joi.string().min(5).required(),
    leader: Joi.string().required(),
    duration: Joi.string().min(3).max(8),
    resourcesURL: Joi.string(),
    meetingHref: Joi.string(),
    usefulLinks: Joi.array(),
    description: Joi.string().max(1024),
    tags: Joi.array().items(Joi.string()).required(),
  });
  return schema.validate(data);
};

const handleTopic = (data) => {
  const schema = Joi.object({
    topic: Joi.string().min(5).max(256).required(),
    votes: Joi.number(),
    addedDate: Joi.date().timestamp(),
    userAdded: Joi.string().min(6).max(40),
    tags: Joi.array().items(Joi.string()).required(),
  });
  return schema.validate(data);
};

const handleUser = (data) => {
  const schema = Joi.object({
    userNickName: Joi.String(),
    userFirstName: Joi.String(),
    userSecondName: Joi.String(),
    userAge: Joi.Number(),
    userTechnologies: Joi.Array(),
    usuerDescription: Joi.String(),
    userSocials: Joi.Object(),
  });
  return schema.validate(data);
};

module.exports.handleMeeting = handleMeeting;
module.exports.handleTopic = handleTopic;
module.exports.handleUser = handleUser;
