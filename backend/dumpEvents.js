require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');

const MONGO_URI = process.env.MONGO_URI;

async function printEvents() {
  try {
    await mongoose.connect(MONGO_URI);
    const events = await Event.find({}, 'title location.address');
    console.log("All Events in DB:");
    events.forEach(e => console.log(`- Title: "${e.title}" | Address: "${e.location?.address}"`));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

printEvents();
