const router = require('express').Router();
const User = require('../model/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verify = require('../middlewares/verifyToken');
const { registerValidation, loginValidation } = require('../validation/validation');

router.post('/register', async (req, res) => {
    //Data validation
    const { error } = registerValidation(req.body); 
    if(error) {
        return res.status(400).send({error: error.details[0].message}); // 400 bad request
    }

    // Cheking if email already exist
    const emailExist = await User.findOne({ email: req.body.email });
    if(emailExist) {
        return res.status(400).send({error: 'Email already exist'});
    }

    //Password hashing
    const salt = await bcrypt.genSalt(10); // complessità con verrà eseguita la funzione di hash
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    //Creating a new user
    const user = new User({
        name: req.body.name,
        surname: req.body.surname,
        email: req.body.email,
        password: hashedPassword
    });
    try {
        const savedUser = await user.save();
        res.send({registration: true});
    } catch(err) {
        res.status(400).send({error: err});
    }
});

router.post('/login', async (req, res) => {
    //Data validation
    const { error } = loginValidation(req.body); 
    if(error) {
        return res.status(400).send({error: error.details[0].message}); // 400 bad request
    }

    // Cheking if email exist
    const user = await User.findOne({ email: req.body.email });
    if(!user) {
        return res.status(400).send({error: 'Email or password is wrong'});
    }

    //Password validation
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if(!validPassword) {
        return res.status(400).send({error: 'Email or password is wrong'});
    }

    //Creating the token
    const token  = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET);
    res.header('auth-token', token).send({login: true});
});

router.get('/authorization', verify, async (req, res) => {
    res.status(200).send({authorization: true});
});

module.exports = router;