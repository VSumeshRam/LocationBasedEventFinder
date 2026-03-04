const Event = require('../models/Event');
const User = require('../models/User');

exports.createEvent = async (req, res) => {
    try {
        const { title, description, date, location, organizer, regLink } = req.body;

        // Logical Check: Is this person an approved organizer?
        const checkUser = await User.findById(organizer);

        if (!checkUser || checkUser.role !== 'Organizer' || !checkUser.isApproved) {
            return res.status(403).json({ message: "Action Blocked: Your organization is not yet verified by Admin." });
        }

        const event = await Event.create({
            title, description, date, location, organizer, regLink
        });
        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getEvents = async (req, res) => {
    try {
        const events = await Event.find().populate('organizer', 'name email');
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};