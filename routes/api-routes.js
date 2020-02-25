const router = require('express').Router();

router.get('/', (req, res) => {
    res.json({ message: "what are you looking for?" });
});

module.exports = router;