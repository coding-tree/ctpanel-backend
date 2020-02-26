const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const topicSchema = new Schema({
  topic: String,
  votes: { type: Number, default: 0 },
  addedDate: { type: Date, default: Date.now },
  userAdded: { type: String, default: "Gall Anonim" },
  tags: Array
});

const Topic = mongoose.model('topics', topicSchema);

module.exports = Topic;
