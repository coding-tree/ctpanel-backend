const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: String,
  googleId: String,
  thumbnail: String,
  // custom
  userFirstName: String,
  userLastName: String,
  userEmail: String,
  userPhone: Number,
  userGoogle: String,
  userFacebook: String,
  userGithub: String,
  userDiscord: String,
  userPresence: String,
  userTimeSpent: String,
  userAverageMark: String,
  userMaxMark: Number,
  userMinMark: Number,
  userLongestTime: String,
  userLeadershipAmount: Number,
  // to hash
  userPassword: String,
});

const User = mongoose.model('user', userSchema);

module.exports = User;
