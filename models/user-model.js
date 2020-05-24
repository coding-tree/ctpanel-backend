const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  userNickName: String,
  userFirstName: String,
  userSecondName: String,
  userAge: Number,
  userTechnologies: Array,
  usuerDescription: String,
  userSocials: Object,
});

const User = mongoose.model('user', userSchema);

module.exports = User;
