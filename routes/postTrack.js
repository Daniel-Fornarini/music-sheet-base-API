const router = require('express').Router();
const verify = require('../middlewares/verifyToken');
const Track = require('../model/Track');
const User = require('../model/User');
const multer = require('multer');
const { trackValidation } = require('../validation/validation');
const User = require('../model/User');

const storage = multer.diskStorage({ 
    destination: function(req, file, cb) { //multer esegue queste funzioni ogni volta che un file viene ricevuto
        cb(null, './uploads'); // errore e cartella dove mettere il file
    },
    filename: function(req, file, cb) {
        const name = file.originalname;
        cb(null, new Date().toISOString() + name.replace(/ /g, '_'));
    }
});

let extensionFlag;
let existFlag;

const fileFilter = (req, file, cb) => {
    extensionFlag = true;
    existFlag = true;
    const { error } = trackValidation(req.body);

    if(error) {
        cb(null, false);
        return;
    }

    if(file.mimetype === undefined) {
        existFlag = false;
        return;
    }

    if (file.mimetype === 'application/pdf') {
        cb(null, true); // salva il file
        return;
    } 
    else {
        cb(extensionFlag = false, false);
        return;
    }
}

const upload = multer({ // inizializza multer e dice dove salvare i file
    storage: storage,
    fileFilter: fileFilter
});

router.post('/', verify, upload.single('music_sheet'), async (req, res) => { // upload.single() solo un file consentito. è un middleware

    if(!existFlag) {
        return res.status(400).send({error: 'A file is required'});    
    }

    if(!extensionFlag) {
        return res.status(400).send({error: 'only pdf!'});
    }

    const { error } = trackValidation(req.body);
    if(error) {
        return res.status(400).send({error: error.details[0].message});
    }

    const user = await User.findById(req.user);

    const track = new Track({
        title: req.body.title,
        music_sheet: req.protocol + '://' + req.get('host') + '/' + req.file.path,
        duration: req.body.duration,
        year_of_composition: req.body.year_of_composition,
        key: req.body.key,
        video: req.body.video,
        composer: req.body.composer,
        posted_by: user.name + ' ' + user.surname
    });
    try {
        const savedTrack = await track.save();
        res.send(savedTrack);
    } catch(err) {
        res.status(400).send({error: err});
    }
    
});

module.exports = router;