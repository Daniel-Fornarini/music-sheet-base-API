const router = require('express').Router();
const Track = require('../model/Track');

router.get('/:composer', async (req, res) =>{
    try {
        const tracks = await Track.find({composer: req.params.composer});
        res.send(tracks);
    } catch(err) {
        res.status(400).send({error: err});
    }
});

module.exports = router;