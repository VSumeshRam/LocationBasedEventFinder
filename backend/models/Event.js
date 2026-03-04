const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    eventType: { type: String, default: 'Workshop' },
    location: {
        address: { type: String, required: true },
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    regLink: { type: String, required: true },

    // <-- Added the Interested Users Array Here -->
    interestedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]

}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);