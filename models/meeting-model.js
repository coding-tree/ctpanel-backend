const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const meetingSchema = new Schema({
  id: Number,
  date: Number,
  topic: String,
  leader: String,
  duration: String,
  resourcesURL: String,
  usefulLinks: Array,
  description: String,
});

const Meeting = mongoose.model('meetings', meetingSchema);

module.exports = Meeting;
