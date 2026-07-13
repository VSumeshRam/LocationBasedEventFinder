require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI;

const oldEventTitleToRemove = "Yoga and Meditation Retreat";

const newEventData = {
  title: "Pala Book Fair",
  description: "A week-long literary festival and book fair featuring top publishers from across the country.",
  date: new Date("2026-07-28T10:00:00Z"),
  eventType: "Conference",
  location: {
    address: "Pala Municipal Town Hall, Pala",
    lat: 9.7126,
    lng: 76.6853
  }
};

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Remove the Yoga event
    await Event.deleteOne({ title: oldEventTitleToRemove });
    console.log(`Deleted event: ${oldEventTitleToRemove}`);

    let organizer = await User.findOne();
    if (!organizer) {
      organizer = new User({
        name: "Admin User",
        email: "admin@example.com",
        password: "hashedpassword123",
        role: "admin",
        isApproved: true
      });
      await organizer.save();
    }
    
    // Check if the Pala Book Fair already exists to avoid duplicates if run multiple times
    const existing = await Event.findOne({ title: newEventData.title });
    if (!existing) {
      const eventToInsert = { ...newEventData, organizer: organizer._id };
      await Event.create(eventToInsert);
      console.log(`Added new event: ${newEventData.title}`);
    } else {
      console.log(`Event ${newEventData.title} already exists.`);
    }

    process.exit(0);
  } catch (err) {
    console.error("Error inserting events:", err);
    process.exit(1);
  }
}

seed();
