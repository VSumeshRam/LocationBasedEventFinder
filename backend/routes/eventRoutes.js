const express = require('express');
const router = express.Router();
// Make sure to import the new deleteEvent function here!
const { createEvent, getEvents, markInterested, deleteEvent } = require('../controllers/eventController');

router.post('/', createEvent);
router.get('/', getEvents);
router.put('/:id/interested', markInterested);
router.delete('/:id', deleteEvent); // <-- The new Delete Route

module.exports = router;