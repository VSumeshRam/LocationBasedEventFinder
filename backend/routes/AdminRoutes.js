const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET all pending organizers for Garry's panel
router.get('/pending-organizers', async (req, res) => {
    try {
        const pending = await User.find({ role: 'Organizer', isApproved: false });
        res.json(pending);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// APPROVE an organizer
router.put('/approve-organizer/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
        res.json({ message: `${user.name} is now approved to post events!` });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;