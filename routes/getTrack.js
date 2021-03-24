const router = require('express').Router();
const Track = require('../model/Track');

router.get('/', async (req, res) => {
    try {
        const tracks = await Track.find();
        res.send(tracks);
    } catch(err) {
        res.status(400).send({error: err});
    }
});

router.get('/:trackTitle', async (req, res) => {
    try {
        const tracks = await Track.find({title: req.params.trackTitle.toLowerCase()});
        res.send(tracks);
    } catch(err) {
        res.status(400).send({error: err});
    }  
});

module.exports = router;