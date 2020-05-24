const router = require('express').Router();
const UserModel = require('../models/user-model');
const paginatedResults = require('../middleware/paginate');
const {handleUser} = require('../middleware/validation');

router.get('/', (req, res) => {
  res.json({message: 'what are you looking for?'});
});

router.get('/user/:nickname', async (req, res) => {
  try {
    const user = await UserModel.findOne({userNickName: req.params.nickname}).exec();
    res.json(user);
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = router;
