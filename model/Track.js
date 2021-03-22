const mongoose = require('mongoose');

const date = new Date();

const trackSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    composer: {
        type: String,
        required: true
    },
    duration: {
        type: String,
        required: true
    },
    year_of_composition: {
        type: String,
        default: 'unavailable'
    },
    key: {
        type: String,
        required: true
    },
    video: {
        type: String,
        required: true
    },
    music_sheet: {
        type: String,
        required: true
    },
    posted_by: {
        type: String,
        required: true
    },
    post_date: {
        type: String,
        default: `${date.getDate()}/${date.getMonth() + 1 }/${date.getFullYear()}`
    }
});

module.exports = mongoose.model('Tracks', trackSchema);