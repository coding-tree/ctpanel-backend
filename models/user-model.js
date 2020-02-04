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
  // to hash
  userPassword: String,
});

const User = mongoose.model('user', userSchema);

module.exports = User;
