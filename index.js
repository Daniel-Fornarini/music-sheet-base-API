const express = require('express');
const app = express();
const mongoose = require('mongoose')
const dotenv = require('dotenv');
const cors = require('cors');

//Import Routes
const authRoute = require('./routes/auth');
const postRoute = require('./routes/postTrack');
const composerRoute = require('./routes/getComposer');
const trackRoute = require('./routes/getTrack');

dotenv.config();

//DB Connection
mongoose.connect(
    process.env.DB_CONNECTION,
    { useNewUrlParser: true },
    () => console.log("Connected to DB!")
);

//Middlewares
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads')); // rende la cartella accessibile 

//Route Middlewares
app.use('/api/user', authRoute);
app.use('/api/POST/track', postRoute);
app.use('/api/GET/composer', composerRoute);
app.use('/api/GET/tracks', trackRoute);

app.listen(3000, () => console.log('Server is up and running'));