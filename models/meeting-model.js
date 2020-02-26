const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const meetingSchema = new Schema({
  date: Number,
  topic: String,
  leader: String,
  duration: { type: String, default: "1h30m" },
  resourcesURL: String,
  usefulLinks: Array,
  description: { type: String, default: "komuś się nie chciało wpisać opisu" },
  tags: Array
});

const Meeting = mongoose.model('meetings', meetingSchema);

module.exports = Meeting;
