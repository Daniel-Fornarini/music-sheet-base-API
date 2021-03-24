const router = require('express').Router();
const verify = require('../middlewares/verifyToken');
const Track = require('../model/Track');
const User = require('../model/User');
const multer = require('multer');
const { trackValidation } = require('../validation/validation');
const AWS = require('aws-sdk');
const{ v4: uuidv4 } = require('uuid');
const { link } = require('@hapi/joi');

uuid = uuidv4();

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION  
});

const storage = multer.memoryStorage({ //diskStorage()
    destination: function(req, file, cb) { //multer esegue queste funzioni ogni volta che un file viene ricevuto
        //cb(null, './uploads'); // errore e cartella dove mettere il file
        cb(null, '');
    }
    // filename: function(req, file, cb) {
    //     let name = file.originalname;
    //     name = name.replace(/ /g, '_');
    //     name = name.replace(/%/g, '_')
    //     cb(null, new Date().toISOString() + name);
    // }
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

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${uuid}.pdf`,
        Body: req.file.buffer,
        ContentType: 'application/pdf',
        ACL: 'public-read'
    }

    s3.upload(params, async (err, data) => {
        if(err) {
            return res.status(400).send({error: err});
        }

        const link = await data.Location;
        const user = await User.findById(req.user);

        const track = new Track({
            title: req.body.title.toLowerCase(),
            //music_sheet: req.protocol + '://' + req.get('host') + '/' + req.file.path,
            music_sheet: link,
            duration: req.body.duration,
            year_of_composition: req.body.year_of_composition,
            key: req.body.key.toLowerCase(),
            video: req.body.video,
            composer: req.body.composer.toLowerCase(),
            posted_by: user.name + ' ' + user.surname
        });
        try {
            const savedTrack = await track.save();
            res.send(savedTrack);
        } catch(err) {
            res.status(400).send({error: err});
        }
    });   
});

module.exports = router;