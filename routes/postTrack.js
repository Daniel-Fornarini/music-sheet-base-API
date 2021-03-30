const router = require('express').Router();
const verify = require('../middlewares/verifyToken');
const Track = require('../model/Track');
const User = require('../model/User');
const multer = require('multer');
const { trackValidation } = require('../validation/validation');
const AWS = require('aws-sdk');
//const{ v4: uuidv4 } = require('uuid');
const { link } = require('@hapi/joi');
const crypto = require('crypto');

//const id = crypto.randomBytes(20).toString('hex');

//uuid = uuidv4();

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION  
});

// const storage = multer.diskStorage({ //diskStorage()
//     destination: function(req, file, cb) { //multer esegue queste funzioni ogni volta che un file viene ricevuto
//         cb(null, './uploads'); // errore e cartella dove mettere il file
//         cb(null, '');
//     },
//     filename: function(req, file, cb) {
//         let name = file.originalname;
//         name = name.replace(/ /g, '_');
//         name = name.replace(/%/g, '_')
//         cb(null, new Date().toISOString() + name);
//     }
// });

const storage = multer.memoryStorage({
    destination: function(req, res, cb) {
        cb(null, '');
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true); // salva il file
    } else {
        cb(null,false);
        return cb(new Error('only pdf'));
    }
}

const upload = multer({
    storage: storage,
    fileFilter: fileFilter
}).single('music_sheet');

router.post('/', verify, async (req, res) => {

    upload(req, res, function (err) {
        if(err instanceof multer.MulterError) {
            return res.stattus(400).send({error: err.message});
        } else if (err) {
            return res.send({error: err.message});
        }
        if(!req.file) {
            return res.status(400).send({error: 'file is required'})
        }

        const { error } = trackValidation(req.body);
        if(error) {
            return res.status(400).send({error: error.details[0].message});
        }

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `${crypto.randomBytes(20).toString('hex')}.pdf`,
            Body: req.file.buffer,
            //ContentType: 'application/pdf',
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
                res.send({id: savedTrack._id});
            } catch(err) {
                res.status(400).send({error: err});
            }
        });   
    })
});

module.exports = router;